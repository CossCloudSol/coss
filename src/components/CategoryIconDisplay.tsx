'use client'

import {
  BarChart2, Cloud, Settings, Code2, Database,
  Shield, Building2, TestTube2, Palette, Users,
  Briefcase, Rocket, BookOpen
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  'data-analytics-bi':              BarChart2,
  'cloud-computing':                Cloud,
  'devops-multi-cloud':             Settings,
  'programming-full-stack':         Code2,
  'programming-full-stack-development': Code2,
  'data-engineering':               Database,
  'cyber-security':                 Shield,
  'cyber-security-networking':      Shield,
  'erp-crm-enterprise-tools':       Building2,
  'software-testing-os':            TestTube2,
  'digital-design':                 Palette,
  'professional-soft-skills':       Users,
  'human-resource':                 Briefcase,
  'quantum-computing':              Rocket,
}

export function CategoryIconDisplay({
  slug,
  color,
  size = 32,
}: {
  slug: string
  color?: string | null
  size?: number
}) {
  const Icon: LucideIcon = ICONS[slug] ?? BookOpen
  return (
    <Icon
      size={size}
      color={color || '#5eead4'}
      aria-hidden="true"
    />
  )
}
