import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { realSendsAllowed } from '@/lib/buffer-client';
import { sendSocialPost } from '@/lib/social-post-send';
import { formatIst } from '@/lib/social-post-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Three channels plus Instagram's JPEG upload can pass the 10 s default.
export const maxDuration = 60;

type Ctx = { params: { id: string } };

/**
 * "Send now": sends an approved (queued) post to Buffer immediately instead
 * of waiting for the daily cron. Same checks and code path as the cron
 * (sendSocialPost); Buffer publishes it about 5 minutes later.
 */
export async function POST(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const guard = realSendsAllowed();
  if (!guard.ok) return NextResponse.json({ ok: false, blocked: true, error: guard.reason, message: guard.reason }, { status: 503 });

  const post = await prisma.socialPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (post.status !== 'queued') {
    return NextResponse.json({ error: `Only approved (queued) posts can be sent; this one is ${post.status}.` }, { status: 409 });
  }

  try {
    const outcome = await sendSocialPost(post);
    if (outcome.status === 'blocked') {
      return NextResponse.json({ ok: false, blocked: true, error: outcome.lastError, message: outcome.lastError }, { status: 503 });
    }
    if (outcome.status === 'skipped') {
      return NextResponse.json({ error: 'This post is already being sent (by the cron or another admin). Refresh in a minute.' }, { status: 409 });
    }
    const message =
      outcome.status === 'sent'
        ? `Sent to Buffer; publishes about ${formatIst(outcome.dueAt as Date)}.`
        : outcome.status === 'queued'
          ? `Not sent yet (will retry): ${outcome.lastError}`
          : `Failed: ${outcome.lastError}`;
    return NextResponse.json({ ok: outcome.status === 'sent', status: outcome.status, lastError: outcome.lastError, message });
  } catch (err) {
    console.error('[POST /api/admin/social-posts/[id]/send]', err);
    return NextResponse.json({ error: `Send failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
