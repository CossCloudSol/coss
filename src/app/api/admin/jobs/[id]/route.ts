import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const job = await prisma.job.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    console.error('[GET /api/admin/jobs/[id]]', err);
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        title:           body.title          as string,
        slug:            body.slug           as string,
        company:         body.company        as string,
        companyLogo:     (body.companyLogo as string)  || null,
        location:        body.location       as string,
        type:            body.type           as string,
        mode:            body.mode           as string,
        category:        body.category       as string,
        experience:      body.experience     as string,
        salary:          (body.salary as string)       || null,
        description:     (body.description as string)  || '',
        skills:          Array.isArray(body.skills) ? (body.skills as string[]) : [],
        applyUrl:        (body.applyUrl as string)     || null,
        relatedCourseId: (body.relatedCourseId as string) || null,
        status:          (body.status as string)       || 'active',
        featured:        Boolean(body.featured),
        expiresAt:       body.expiresAt ? new Date(body.expiresAt as string) : null,
      },
    });
    return NextResponse.json(job);
  } catch (err) {
    console.error('[PUT /api/admin/jobs/[id]]', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/jobs/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
