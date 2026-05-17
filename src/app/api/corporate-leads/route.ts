import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Prisma needs the Node runtime — and we never want this cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

const corporateLeadSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be 100 characters or fewer'),
  contactPerson: z
    .string()
    .trim()
    .min(2, 'Contact person must be at least 2 characters')
    .max(100, 'Contact person must be 100 characters or fewer'),
  // Accept either a bare 10-digit number ("9870250243") or one already
  // prefixed with +91 ("+919870250243"). The form's onSubmit prefixes +91
  // before POSTing, so without the optional prefix here we'd reject every
  // submission. Strip non-digits first, drop a leading "91" if that makes
  // the result 12 digits, validate as 10 digits, then re-prefix canonically.
  phone: z
    .string()
    .trim()
    .transform((raw) => {
      const digits = raw.replace(/\D/g, '');
      return digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : digits;
    })
    .pipe(
      z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number'),
    )
    .transform((tenDigit) => `+91${tenDigit}`),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
  trainingDomain: z
    .string()
    .trim()
    .min(1, 'Training domain is required')
    .max(200, 'Training domain must be 200 characters or fewer'),
  employeeCount: z
    .string()
    .trim()
    .min(1, 'Employee count is required')
    .max(50, 'Employee count must be 50 characters or fewer'),
});

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[POST /api/corporate-leads] Invalid JSON body:', err);
    return NextResponse.json(
      {
        success: false,
        errors: { _root: ['Request body is not valid JSON'] },
      },
      { status: 422 },
    );
  }

  const parsed = corporateLeadSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error('[POST /api/corporate-leads] Validation failed:', fieldErrors);
    return NextResponse.json(
      { success: false, errors: fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    await prisma.corporateLead.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone, // already +91-prefixed by the schema transform
        email: data.email,
        trainingDomain: data.trainingDomain,
        employeeCount: data.employeeCount,
        status: 'new',
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    // Always log on the server so the real cause is in the terminal even
    // when the client only sees a generic message in production.
    console.error('[POST /api/corporate-leads] Insert failed:', err);

    const isDev = process.env.NODE_ENV !== 'production';
    const message =
      isDev && err instanceof Error ? err.message : 'Something went wrong';

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
