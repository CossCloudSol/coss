'use client'
import { CATEGORY_ICONS, DEFAULT_ICON } from '@/lib/category-icons'

export function CategoryIconDisplay({ slug, color }: { slug: string; color?: string }) {
  const Icon = CATEGORY_ICONS[slug] ?? DEFAULT_ICON
  return <Icon size={32} color={color || '#5eead4'} aria-hidden="true" />
}
