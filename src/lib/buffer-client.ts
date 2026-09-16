/**
 * Buffer API client (GraphQL only — Buffer has no REST API and no OAuth for
 * this integration; auth is a single personal access key).
 *
 * Free plan limits:
 * - 10 scheduled posts queued per channel (a queue cap, not a monthly allowance)
 * - 3,000 requests per 30 days
 * - 100 requests per 15 minutes
 *
 * BUFFER_API_KEY expires 2027-09-13. Auth failures are detected and surface
 * expiry as the likely cause so this reads as a clear admin message instead
 * of posts silently failing to schedule.
 */

const BUFFER_API_URL = 'https://api.buffer.com';
const REQUEST_TIMEOUT_MS = 15_000;

// Account-specific: Coss Cloud Solutions' Buffer organization/channel.
const LINKEDIN_CHANNEL_ID = '6aa6ca86ea19ca0bde35bd08';
const ORGANIZATION_ID = '6aa6b591da36a3ea4daa5ce9';

export type BufferError = {
  message: string;
  authFailure?: boolean;
};

export type BufferResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BufferError; retryable: boolean };

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: { code?: string };
  }>;
};

async function bufferRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<BufferResult<T>> {
  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: { message: 'BUFFER_API_KEY is not set' },
      retryable: false,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(BUFFER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      ok: false,
      error: { message },
      retryable: true,
    };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      error: {
        message: `Buffer authentication failed (HTTP ${response.status}). BUFFER_API_KEY expires 2027-09-13 — if that date has passed, this is likely why.`,
        authFailure: true,
      },
      retryable: false,
    };
  }

  if (response.status >= 500) {
    return {
      ok: false,
      error: { message: `Buffer server error (HTTP ${response.status})` },
      retryable: true,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: { message: `Buffer request failed (HTTP ${response.status})` },
      retryable: false,
    };
  }

  let body: GraphQLResponse<T>;
  try {
    body = await response.json();
  } catch {
    return {
      ok: false,
      error: { message: 'Buffer response was not valid JSON' },
      retryable: true,
    };
  }

  if (body.errors && body.errors.length > 0) {
    const message = body.errors.map((e) => e.message).join('; ');
    const isAuthError = body.errors.some(
      (e) =>
        e.extensions?.code === 'UNAUTHENTICATED' ||
        e.extensions?.code === 'FORBIDDEN' ||
        /unauthenticated|unauthorized|invalid.*token|invalid.*key/i.test(e.message)
    );
    if (isAuthError) {
      return {
        ok: false,
        error: {
          message: `Buffer authentication failed: ${message}. BUFFER_API_KEY expires 2027-09-13 — if that date has passed, this is likely why.`,
          authFailure: true,
        },
        retryable: false,
      };
    }
    return {
      ok: false,
      error: { message },
      retryable: false,
    };
  }

  if (!body.data) {
    return {
      ok: false,
      error: { message: 'Buffer response had no data' },
      retryable: true,
    };
  }

  return { ok: true, data: body.data };
}

export type BufferChannel = {
  id: string;
  displayName: string;
  service: string;
};

/** Reads the organization's channels. Used for health checks. */
export async function getChannels(): Promise<BufferResult<BufferChannel[]>> {
  const query = `
    query GetChannels($organizationId: OrganizationId!) {
      organization(id: $organizationId) {
        channels {
          id
          displayName
          service
        }
      }
    }
  `;

  const result = await bufferRequest<{
    organization: { channels: BufferChannel[] };
  }>(query, { organizationId: ORGANIZATION_ID });

  if (!result.ok) return result;
  return { ok: true, data: result.data.organization.channels };
}

export type CreatePostInput = {
  text: string;
  channelId: string;
  dueAt: Date;
  imageUrl?: string;
  imageAltText?: string;
  linkUrl?: string;
};

export type CreatePostResult = {
  id: string;
};

/** Creates a scheduled post on Buffer. */
export async function createPost(
  input: CreatePostInput
): Promise<BufferResult<CreatePostResult>> {
  const { text, channelId, dueAt, imageUrl, imageAltText, linkUrl } = input;

  // Media (assets) and a link preview attachment are mutually exclusive.
  const assets =
    imageUrl != null
      ? [
          {
            image: {
              url: imageUrl,
              metadata: { altText: imageAltText ?? '' },
            },
          },
        ]
      : undefined;

  const metadata =
    !assets && linkUrl
      ? { linkedin: { linkAttachment: { url: linkUrl } } }
      : undefined;

  const query = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        post {
          id
        }
      }
    }
  `;

  const variables = {
    input: {
      text,
      channelId,
      schedulingType: 'SCHEDULED',
      mode: 'SCHEDULE',
      dueAt: Math.floor(dueAt.getTime() / 1000),
      ...(assets ? { assets } : {}),
      ...(metadata ? { metadata } : {}),
    },
  };

  const result = await bufferRequest<{
    createPost: { post: { id: string } };
  }>(query, variables);

  if (!result.ok) return result;
  return { ok: true, data: { id: result.data.createPost.post.id } };
}

/** Deletes a scheduled post from Buffer. */
export async function deletePost(id: string): Promise<BufferResult<{ id: string }>> {
  const query = `
    mutation DeletePost($id: PostId!) {
      deletePost(id: $id) {
        id
      }
    }
  `;

  const result = await bufferRequest<{ deletePost: { id: string } }>(query, { id });

  if (!result.ok) return result;
  return { ok: true, data: { id: result.data.deletePost.id } };
}

export { LINKEDIN_CHANNEL_ID, ORGANIZATION_ID };
