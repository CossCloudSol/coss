import { getBranchSettings } from '@/lib/get-branch-settings'

export interface TrustStats {
  rating: string
  reviewDisplay: string
}

// Canonical rating: Dilsukhnagar branch (primary); reviewCount displayed with + suffix
export async function getTrustStats(): Promise<TrustStats> {
  const branch = await getBranchSettings('dilsukhnagar')
  return {
    rating: branch.aggregateRating.toFixed(1),
    reviewDisplay: branch.reviewCount > 0
      ? `${branch.reviewCount.toLocaleString('en-IN')}+`
      : '1,200+',
  }
}
