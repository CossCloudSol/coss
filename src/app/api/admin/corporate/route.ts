import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// Prisma uses Node built-ins — cannot run on the Edge runtime.
export const runtime = 'nodejs';
// Always live data — admin views must reflect the DB on every request.
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Response shape                                                            */
/* -------------------------------------------------------------------------- */

export interface AdminCorporateLeadItem {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  trainingDomain: string;
  employeeCount: string;
  status: string;
  createdAt: string; // ISO
}

export interface AdminCorporateLeadsListResponse {
  leads: AdminCorporateLeadItem[];
}

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

  try {
    const rows = await prisma.corporateLead.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        email: true,
        trainingDomain: true,
        employeeCount: true,
        status: true,
        createdAt: true,
      },
    });

    const payload: AdminCorporateLeadsListResponse = {
      leads: rows.map((row) => ({
        id: row.id,
        companyName: row.companyName,
        contactPerson: row.contactPerson,
        phone: row.phone,
        email: row.email,
        trainingDomain: row.trainingDomain,
        employeeCount: row.employeeCount,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/corporate] DB error:', err);
    return NextResponse.json({ error: 'Failed to load corporate leads' }, { status: 500 });
  }
}
