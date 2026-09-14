import { prisma } from '@/lib/db';

/** Shared by the public /faculty page. */
export async function findTrainers() {
  return prisma.trainer.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

/** Years of experience, derived from startYear against the current year — never stored. */
export function getYearsOfExperience(startYear: number | null | undefined): number | null {
  if (!startYear) return null;
  const years = new Date().getFullYear() - startYear;
  return years >= 0 ? years : null;
}

/** Splits a comma-separated field (skills, teaches) into a trimmed, non-empty array. */
export function splitCommaList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}
