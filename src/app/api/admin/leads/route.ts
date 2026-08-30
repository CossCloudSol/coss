import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// Prisma uses Node built-ins — cannot run on the Edge runtime.
export const runtime = 'nodejs';
// Always a live read against the DB.
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Response shape                                                            */
/* -------------------------------------------------------------------------- */

export interface AdminLeadListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  course: string | null;
  branch: string;
  formType: string;
  status: string;
  createdAt: string; // ISO
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  landingPage: string | null;
  submitPath: string | null;
  deviceType: string | null;
  jobId: string | null;
  jobTitle: string | null;
  jobCompany: string | null;
  _count: {
    activities: number;
  };
}

export interface AdminLeadsListResponse {
  leads: AdminLeadListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/*  Query-string validation                                                   */
/* -------------------------------------------------------------------------- */

const ALLOWED_STATUS = new Set(['new', 'contacted', 'enrolled', 'lost']);
const ALLOWED_BRANCH = new Set(['dilsukhnagar', 'ameerpet', 'online']);
const ALLOWED_SORT = new Set<'createdAt' | 'name'>(['createdAt', 'name']);
const ALLOWED_ORDER = new Set<'asc' | 'desc'>(['asc', 'desc']);

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest): Promise<Response> {
  // Session check — middleware guards `/admin/*` but not `/api/admin/*`.
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const statusParam = (searchParams.get('status') ?? '').trim().toLowerCase();
  const branchParam = (searchParams.get('branch') ?? '').trim().toLowerCase();
  const searchRaw = (searchParams.get('search') ?? '').trim();

  const pageRaw = Number(searchParams.get('page') ?? '1');
  const page =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  const limitRaw = Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT));
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1
      ? Math.min(MAX_LIMIT, Math.floor(limitRaw))
      : DEFAULT_LIMIT;

  const sortRaw = searchParams.get('sort');
  const sortField: 'createdAt' | 'name' =
    sortRaw && ALLOWED_SORT.has(sortRaw as 'createdAt' | 'name')
      ? (sortRaw as 'createdAt' | 'name')
      : 'createdAt';

  const orderRaw = searchParams.get('order');
  const sortOrder: 'asc' | 'desc' =
    orderRaw && ALLOWED_ORDER.has(orderRaw as 'asc' | 'desc')
      ? (orderRaw as 'asc' | 'desc')
      : 'desc';

  // Build the Prisma where clause dynamically. Unknown values are ignored
  // rather than 400'd so ad-hoc tweaks to the URL don't crash the UI.
  const where: Prisma.LeadWhereInput = {};
  if (statusParam && ALLOWED_STATUS.has(statusParam)) {
    where.status = statusParam;
  }
  if (branchParam && ALLOWED_BRANCH.has(branchParam)) {
    where.branch = branchParam;
  }
  if (searchRaw.length > 0) {
    where.OR = [
      { name: { contains: searchRaw, mode: 'insensitive' } },
      { phone: { contains: searchRaw, mode: 'insensitive' } },
      { email: { contains: searchRaw, mode: 'insensitive' } },
      { course: { contains: searchRaw, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sortField === 'name' ? { name: sortOrder } : { createdAt: sortOrder };

  try {
    const [total, rawLeads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          course: true,
          branch: true,
          formType: true,
          status: true,
          createdAt: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          referrer: true,
          landingPage: true,
          submitPath: true,
          deviceType: true,
          jobId: true,
          jobTitle: true,
          jobCompany: true,
          _count: { select: { activities: true } },
        },
      }),
    ]);

    const payload: AdminLeadsListResponse = {
      leads: rawLeads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        course: lead.course,
        branch: lead.branch,
        formType: lead.formType,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        referrer: lead.referrer,
        landingPage: lead.landingPage,
        submitPath: lead.submitPath,
        deviceType: lead.deviceType,
        jobId: lead.jobId,
        jobTitle: lead.jobTitle,
        jobCompany: lead.jobCompany,
        _count: { activities: lead._count.activities },
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/leads] DB error:', err);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
