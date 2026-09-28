import { NextResponse } from 'next/server';
import { getSearchIndex } from '@/lib/course-search-index';

/**
 * Course search index: built at build time and regenerated (ISR) daily or
 * when an admin changes a course or batch (revalidatePath). The header search
 * loads it on first focus.
 */
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const index = await getSearchIndex();
  return NextResponse.json(index);
}
