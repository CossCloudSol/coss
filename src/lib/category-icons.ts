import {
  BarChart2,
  BookOpen,
  Briefcase,
  Building,
  Cloud,
  Code,
  Database,
  Palette,
  Rocket,
  Settings,
  Shield,
  TestTube,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'data-analytics-bi':        BarChart2,
  'cloud-computing':          Cloud,
  'devops-multi-cloud':       Settings,
  'programming-full-stack':   Code,
  'data-engineering':         Database,
  'cyber-security':           Shield,
  'erp-crm-enterprise-tools': Building,
  'software-testing-os':      TestTube,
  'digital-design':           Palette,
  'professional-soft-skills': Users,
  'human-resource':           Briefcase,
  'quantum-computing':        Rocket,
}

export const DEFAULT_ICON: LucideIcon = BookOpen
