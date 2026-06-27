import {
  Users,
  Building2,
  MessageCircle,
  BarChart2,
  FolderOpen,
  GraduationCap,
  BookOpen,
  Briefcase,
  Calendar,
  Star,
  Building,
  LayoutDashboard,
  Megaphone,
  Layers,
  Image,
  ArrowLeftRight,
  Search,
  MapPin,
  Globe,
  Braces,
  Home,
  Settings,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  desc: string;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: {
    dark: { bg: string; icon: string };
    light: { bg: string; icon: string };
  };
  items: ReadonlyArray<NavItem>;
};

export const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    color: { dark: { bg: '#0d2a1e', icon: '#3fb950' }, light: { bg: '#dafbe1', icon: '#1a7f37' } },
    items: [
      { label: 'All leads',    icon: Users,         href: '/admin/leads',     desc: 'Enquiries and pipeline' },
      { label: 'Corporate',    icon: Building2,     href: '/admin/corporate', desc: 'Proposal requests' },
      { label: 'WhatsApp log', icon: MessageCircle, href: '/admin/whatsapp',  desc: 'Widget submissions and sends' },
      { label: 'Analytics',   icon: BarChart2,      href: '/admin/analytics', desc: 'Funnel, branches, 30-day volume' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: LayoutGrid,
    color: { dark: { bg: '#1a2c3d', icon: '#58a6ff' }, light: { bg: '#ddf4ff', icon: '#0969da' } },
    items: [
      { label: 'Categories',      icon: FolderOpen,    href: '/admin/categories',     desc: '13 categories' },
      { label: 'Courses',         icon: GraduationCap, href: '/admin/courses',        desc: 'Manage all courses' },
      { label: 'Blog posts',      icon: BookOpen,      href: '/admin/blog',           desc: 'Articles and posts' },
      { label: 'Jobs',            icon: Briefcase,     href: '/admin/jobs',           desc: 'Job listings' },
      { label: 'Batches',         icon: Calendar,      href: '/admin/batches',        desc: 'Upcoming batches' },
      { label: 'Testimonials',    icon: Star,          href: '/admin/testimonials',   desc: 'Student reviews' },
      { label: 'Hiring partners', icon: Building,      href: '/admin/hiring-partners',desc: 'Company logos' },
    ],
  },
  {
    id: 'site',
    label: 'Site',
    icon: Home,
    color: { dark: { bg: '#2d1f0a', icon: '#d29922' }, light: { bg: '#fff8c5', icon: '#9a6700' } },
    items: [
      { label: 'Homepage',       icon: LayoutDashboard, href: '/admin/homepage',       desc: 'Hero, stats, featured courses' },
      { label: 'Topbar',         icon: Megaphone,        href: '/admin/topbar',         desc: 'Announcement banner' },
      { label: 'Content blocks', icon: Layers,           href: '/admin/content-blocks', desc: '19 blocks across 5 pages' },
      { label: 'Media manager',  icon: Image,            href: '/admin/media',          desc: 'Cloudinary assets' },
      { label: 'Redirects',      icon: ArrowLeftRight,   href: '/admin/redirects',      desc: '10 redirect rules' },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: Search,
    color: { dark: { bg: '#2a1f3d', icon: '#8957e5' }, light: { bg: '#fbefff', icon: '#8250df' } },
    items: [
      { label: 'SEO manager', icon: Search, href: '/admin/seo',    desc: 'Per-page meta and settings' },
      { label: 'GEO manager', icon: MapPin, href: '/admin/geo',    desc: 'Branch NAP and coordinates' },
      { label: 'Sitemap',     icon: Globe,  href: '/admin/sitemap',desc: '60 pages, auto-updates' },
      { label: 'Schema',      icon: Braces, href: '/admin/schema', desc: 'JSON-LD structured data' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    color: { dark: { bg: '#21262d', icon: '#8b949e' }, light: { bg: '#f6f8fa', icon: '#656d76' } },
    items: [
      { label: 'Overview', icon: LayoutDashboard, href: '/admin',          desc: 'Dashboard and key metrics' },
      { label: 'Settings', icon: Settings,         href: '/admin/settings', desc: 'NAP, social links, branding' },
    ],
  },
];

export function getActiveGroup(pathname: string): string {
  if (['/admin/leads', '/admin/corporate', '/admin/whatsapp', '/admin/analytics'].some(p => pathname.startsWith(p))) return 'leads';
  if (['/admin/categories', '/admin/courses', '/admin/blog', '/admin/jobs', '/admin/batches', '/admin/testimonials', '/admin/hiring-partners'].some(p => pathname.startsWith(p))) return 'content';
  if (['/admin/homepage', '/admin/topbar', '/admin/content-blocks', '/admin/media', '/admin/redirects'].some(p => pathname.startsWith(p))) return 'site';
  if (['/admin/seo', '/admin/geo', '/admin/sitemap', '/admin/schema'].some(p => pathname.startsWith(p))) return 'seo';
  if (['/admin/settings'].some(p => pathname.startsWith(p))) return 'settings';
  return 'settings';
}
