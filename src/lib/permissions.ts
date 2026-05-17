export type Permission =
  | 'dashboard:view'
  | 'leads:view'
  | 'leads:edit'
  | 'leads:delete'
  | 'corporate:view'
  | 'corporate:edit'
  | 'corporate:delete'
  | 'analytics:view'
  | 'seo:view'
  | 'seo:edit'
  | 'topbar:view'
  | 'topbar:edit'
  | 'whatsapp:view'
  | 'settings:view'
  | 'settings:edit';

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'leads:view',
  'leads:edit',
  'leads:delete',
  'corporate:view',
  'corporate:edit',
  'corporate:delete',
  'analytics:view',
  'seo:view',
  'seo:edit',
  'topbar:view',
  'topbar:edit',
  'whatsapp:view',
  'settings:view',
  'settings:edit',
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  ADMISSIONS_SALES: [
    'dashboard:view',
    'leads:view',
    'leads:edit',
    'corporate:view',
    'corporate:edit',
    'analytics:view',
  ],
  SUPPORT_HELPDESK: [
    'dashboard:view',
    'leads:view',
  ],
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMISSIONS_SALES: 'Admissions & Sales',
  SUPPORT_HELPDESK: 'Support / Helpdesk',
};

export const PERMISSION_GROUPS: Array<{
  label: string;
  permissions: Array<{ key: Permission; label: string }>;
}> = [
  {
    label: 'Dashboard',
    permissions: [{ key: 'dashboard:view', label: 'View' }],
  },
  {
    label: 'Leads',
    permissions: [
      { key: 'leads:view', label: 'View' },
      { key: 'leads:edit', label: 'Edit' },
      { key: 'leads:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Corporate',
    permissions: [
      { key: 'corporate:view', label: 'View' },
      { key: 'corporate:edit', label: 'Edit' },
      { key: 'corporate:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Analytics',
    permissions: [{ key: 'analytics:view', label: 'View' }],
  },
  {
    label: 'SEO Manager',
    permissions: [
      { key: 'seo:view', label: 'View' },
      { key: 'seo:edit', label: 'Edit' },
    ],
  },
  {
    label: 'Topbar / Ann. Bar',
    permissions: [
      { key: 'topbar:view', label: 'View' },
      { key: 'topbar:edit', label: 'Edit' },
    ],
  },
  {
    label: 'WhatsApp Log',
    permissions: [{ key: 'whatsapp:view', label: 'View' }],
  },
  {
    label: 'Settings',
    permissions: [
      { key: 'settings:view', label: 'View' },
      { key: 'settings:edit', label: 'Edit' },
    ],
  },
];
