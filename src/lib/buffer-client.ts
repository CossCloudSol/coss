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
 *
 * Shapes below were confirmed by introspecting the live schema at
 * https://api.buffer.com (root Query/Mutation fields have no "organization"
 * field — channels are read via `channels(input: ChannelsInput!)` — and
 * createPost/deletePost return result unions with typed error members
 * rather than only surfacing failures via the top-level GraphQL `errors`
 * array).
 */

const BUFFER_API_URL = 'https://api.buffer.com';
const REQUEST_TIMEOUT_MS = 15_000;

// Account-specific: Coss Cloud Solutions' Buffer organization/channel.
const LINKEDIN_CHANNEL_ID = '6aa6ca86ea19ca0bde35bd08';
const ORGANIZATION_ID = '6aa6b591da36a3ea4daa5ce9';

export type BufferError = {
  message: string;
  authFailure?: boolean;
  /** LimitReachedError — the channel's scheduled-post queue is full (free plan: 10/channel). */
  limitReached?: boolean;
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
      channels(input: { organizationId: $organizationId }) {
        id
        displayName
        service
      }
    }
  `;

  const result = await bufferRequest<{ channels: BufferChannel[] }>(query, {
    organizationId: ORGANIZATION_ID,
  });

  if (!result.ok) return result;
  return { ok: true, data: result.data.channels };
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

// createPost's result union, as returned by Buffer — a business-logic
// failure (bad channel, queue full, validation, upstream LinkedIn error)
// comes back as one of these typed members inside `data`, not as a
// top-level GraphQL `errors` entry.
type CreatePostPayload =
  | { __typename: 'PostActionSuccess'; post: { id: string } }
  | { __typename: 'NotFoundError'; message: string }
  | { __typename: 'UnauthorizedError'; message: string }
  | { __typename: 'UnexpectedError'; message: string }
  | { __typename: 'RestProxyError'; message: string; code: number | null; link: string | null }
  | { __typename: 'LimitReachedError'; message: string }
  | { __typename: 'InvalidInputError'; message: string };

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
        __typename
        ... on PostActionSuccess {
          post { id }
        }
        ... on NotFoundError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
        ... on RestProxyError { message code link }
        ... on LimitReachedError { message }
        ... on InvalidInputError { message }
      }
    }
  `;

  const variables = {
    input: {
      text,
      channelId,
      schedulingType: 'automatic',
      mode: 'customScheduled',
      dueAt: dueAt.toISOString(),
      ...(assets ? { assets } : {}),
      ...(metadata ? { metadata } : {}),
    },
  };

  const result = await bufferRequest<{ createPost: CreatePostPayload }>(query, variables);
  if (!result.ok) return result;

  const payload = result.data.createPost;
  switch (payload.__typename) {
    case 'PostActionSuccess':
      return { ok: true, data: { id: payload.post.id } };
    case 'UnauthorizedError':
      return {
        ok: false,
        error: {
          message: `Buffer authorization failed: ${payload.message}. BUFFER_API_KEY expires 2027-09-13 — if that date has passed, this is likely why.`,
          authFailure: true,
        },
        retryable: false,
      };
    case 'UnexpectedError':
      return { ok: false, error: { message: payload.message }, retryable: true };
    case 'RestProxyError': {
      const retryable = payload.code != null && payload.code >= 500;
      return { ok: false, error: { message: payload.message }, retryable };
    }
    case 'LimitReachedError':
      return { ok: false, error: { message: payload.message, limitReached: true }, retryable: false };
    case 'NotFoundError':
    case 'InvalidInputError':
      return { ok: false, error: { message: payload.message }, retryable: false };
  }
}

// deletePost's result union.
type DeletePostPayload =
  | { __typename: 'DeletePostSuccess'; id: string }
  | { __typename: 'VoidMutationError'; message: string };

/** Deletes a scheduled post from Buffer. */
export async function deletePost(id: string): Promise<BufferResult<{ id: string }>> {
  const query = `
    mutation DeletePost($input: DeletePostInput!) {
      deletePost(input: $input) {
        __typename
        ... on DeletePostSuccess { id }
        ... on VoidMutationError { message }
      }
    }
  `;

  const result = await bufferRequest<{ deletePost: DeletePostPayload }>(query, {
    input: { id },
  });
  if (!result.ok) return result;

  const payload = result.data.deletePost;
  if (payload.__typename === 'DeletePostSuccess') {
    return { ok: true, data: { id: payload.id } };
  }
  return { ok: false, error: { message: payload.message }, retryable: false };
}

export { LINKEDIN_CHANNEL_ID, ORGANIZATION_ID };
