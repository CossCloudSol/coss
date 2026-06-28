'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
} from '@/lib/permissions';

// ─── Site Settings Types ─────────────────────────────────────────────────────

interface Branch {
  id: string
  branchKey: string
  branchName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  latitude: number
  longitude: number
  workingHoursOpen: string
  workingHoursClose: string
  workingDays: string
}

interface SiteSettingsData {
  primaryPhone?: string
  secondaryPhone?: string
  email?: string
  whatsappNumber?: string
  websiteUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  twitterUrl?: string
  orgName?: string
  orgLegalName?: string
  orgFoundedYear?: string
  orgGstNumber?: string
  googleMapsUrl?: string
}

const inp =
  'w-full bg-white dark:bg-gray-700 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100 placeholder-[#94a3b8] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500'

function SiteSection({
  icon,
  title,
  desc,
  children,
}: {
  icon: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-[#e2e8f0] dark:border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-[#e2e8f0] dark:border-white/10">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-[#0f172a] dark:text-white">{title}</h2>
          <p className="text-xs text-[#475569] dark:text-gray-400">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function SiteField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#475569] dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

function SiteSettingsPanel() {
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData>({})
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings').then((r) => r.json()),
      fetch('/api/admin/geo/branches').then((r) => r.json()),
    ]).then(([s, b]) => {
      setSiteSettings(s ?? {})
      setBranches(Array.isArray(b.branches) ? b.branches : [])
      setLoading(false)
    })
  }, [])

  function setSetting<K extends keyof SiteSettingsData>(key: K, value: string) {
    setSiteSettings((prev) => ({ ...prev, [key]: value }))
  }

  function setBranchField<K extends keyof Branch>(idx: number, key: K, value: Branch[K]) {
    setBranches((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: value } : b)))
  }

  async function saveAll() {
    setSaving(true)
    setSaveMsg('')
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      })
      for (const branch of branches) {
        await fetch(`/api/admin/geo/${branch.branchKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branch),
        })
      }
      setSaveMsg('✓ All changes saved')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('✗ Save failed — check console')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-[#94a3b8] dark:text-gray-400 text-sm">
        Loading site settings…
      </div>
    )
  }

  const activeBranch = branches[activeTab]
  const branchTabLabel = (name: string) => {
    const parts = name.split('—')
    return parts.length > 1 ? parts[parts.length - 1].trim() : name
  }

  return (
    <div className="space-y-6">
      {/* Header + Save */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Site Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Global contact details, branch hours, social links, and organisation info
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith('✓') ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'}`}>
              {saveMsg}
            </span>
          )}
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      {/* Section 1 — Global contact */}
      <SiteSection icon="📞" title="Global Contact Details" desc="Phone numbers, email, and website">
        <div className="grid grid-cols-2 gap-4">
          <SiteField label="Primary Phone">
            <input className={inp} value={siteSettings.primaryPhone ?? ''} onChange={(e) => setSetting('primaryPhone', e.target.value)} placeholder="+91 98765 43210" />
          </SiteField>
          <SiteField label="Secondary Phone">
            <input className={inp} value={siteSettings.secondaryPhone ?? ''} onChange={(e) => setSetting('secondaryPhone', e.target.value)} placeholder="+91 98765 43211" />
          </SiteField>
          <SiteField label="Email">
            <input className={inp} type="email" value={siteSettings.email ?? ''} onChange={(e) => setSetting('email', e.target.value)} placeholder="info@cosscloudsol.com" />
          </SiteField>
          <SiteField label="WhatsApp Number">
            <input className={inp} value={siteSettings.whatsappNumber ?? ''} onChange={(e) => setSetting('whatsappNumber', e.target.value)} placeholder="+91 98765 43210" />
          </SiteField>
        </div>
        <SiteField label="Website URL">
          <input className={inp} value={siteSettings.websiteUrl ?? ''} onChange={(e) => setSetting('websiteUrl', e.target.value)} placeholder="https://cosscloudsol.com" />
        </SiteField>
      </SiteSection>

      {/* Section 2 — Branch NAP + Working hours */}
      <SiteSection icon="📍" title="Branch NAP & Working Hours" desc="Address, contact, and opening hours per branch">
        {branches.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {branches.map((b, idx) => (
              <button
                key={b.branchKey}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={['px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', activeTab === idx ? 'bg-teal-600 text-white' : 'bg-[#f1f5f9] dark:bg-gray-700 text-[#475569] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'].join(' ')}
              >
                {branchTabLabel(b.branchName)}
              </button>
            ))}
          </div>
        )}
        {activeBranch && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <SiteField label="Branch Name">
                <input className={inp} value={activeBranch.branchName} onChange={(e) => setBranchField(activeTab, 'branchName', e.target.value)} />
              </SiteField>
              <SiteField label="Phone">
                <input className={inp} value={activeBranch.phone} onChange={(e) => setBranchField(activeTab, 'phone', e.target.value)} />
              </SiteField>
            </div>
            <SiteField label="Address Line 1">
              <input className={inp} value={activeBranch.addressLine1} onChange={(e) => setBranchField(activeTab, 'addressLine1', e.target.value)} />
            </SiteField>
            <div className="grid grid-cols-3 gap-4">
              <SiteField label="City">
                <input className={inp} value={activeBranch.city} onChange={(e) => setBranchField(activeTab, 'city', e.target.value)} />
              </SiteField>
              <SiteField label="Address Line 2">
                <input className={inp} value={activeBranch.addressLine2} onChange={(e) => setBranchField(activeTab, 'addressLine2', e.target.value)} />
              </SiteField>
              <SiteField label="Pincode">
                <input className={inp} value={activeBranch.pincode} onChange={(e) => setBranchField(activeTab, 'pincode', e.target.value)} />
              </SiteField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SiteField label="Latitude">
                <input className={inp} type="number" step="0.000001" value={activeBranch.latitude} onChange={(e) => setBranchField(activeTab, 'latitude', parseFloat(e.target.value) || 0)} />
              </SiteField>
              <SiteField label="Longitude">
                <input className={inp} type="number" step="0.000001" value={activeBranch.longitude} onChange={(e) => setBranchField(activeTab, 'longitude', parseFloat(e.target.value) || 0)} />
              </SiteField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SiteField label="Opens">
                <input className={inp} type="time" value={activeBranch.workingHoursOpen} onChange={(e) => setBranchField(activeTab, 'workingHoursOpen', e.target.value)} />
              </SiteField>
              <SiteField label="Closes">
                <input className={inp} type="time" value={activeBranch.workingHoursClose} onChange={(e) => setBranchField(activeTab, 'workingHoursClose', e.target.value)} />
              </SiteField>
              <SiteField label="Working Days">
                <input className={inp} value={activeBranch.workingDays} onChange={(e) => setBranchField(activeTab, 'workingDays', e.target.value)} placeholder="Mon-Sun" />
              </SiteField>
            </div>
            {/* NAP preview */}
            <div className="bg-[#f8fafc] dark:bg-gray-900 border border-[#e2e8f0] dark:border-white/10 rounded-lg p-4 text-xs text-[#475569] dark:text-gray-300 space-y-1">
              <p className="font-semibold text-[#0f172a] dark:text-white text-sm">{activeBranch.branchName}</p>
              <p>{[activeBranch.addressLine1, activeBranch.addressLine2, activeBranch.city, activeBranch.state, activeBranch.pincode].filter(Boolean).join(', ')}</p>
              <p>📞 {activeBranch.phone}</p>
              <p>🕐 {activeBranch.workingHoursOpen} – {activeBranch.workingHoursClose} &nbsp;|&nbsp; {activeBranch.workingDays}</p>
            </div>
          </>
        )}
      </SiteSection>

      {/* Section 3 — Social media */}
      <SiteSection icon="🔗" title="Social Media Links" desc="Public profiles and contact handles">
        <div className="grid grid-cols-2 gap-4">
          <SiteField label="Facebook">
            <input className={inp} value={siteSettings.facebookUrl ?? ''} onChange={(e) => setSetting('facebookUrl', e.target.value)} placeholder="https://facebook.com/cosscloudsol" />
          </SiteField>
          <SiteField label="Instagram">
            <input className={inp} value={siteSettings.instagramUrl ?? ''} onChange={(e) => setSetting('instagramUrl', e.target.value)} placeholder="https://instagram.com/cosscloudsol" />
          </SiteField>
          <SiteField label="LinkedIn">
            <input className={inp} value={siteSettings.linkedinUrl ?? ''} onChange={(e) => setSetting('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/cosscloudsol" />
          </SiteField>
          <SiteField label="YouTube">
            <input className={inp} value={siteSettings.youtubeUrl ?? ''} onChange={(e) => setSetting('youtubeUrl', e.target.value)} placeholder="https://youtube.com/@cosscloudsol" />
          </SiteField>
          <SiteField label="Twitter / X">
            <input className={inp} value={siteSettings.twitterUrl ?? ''} onChange={(e) => setSetting('twitterUrl', e.target.value)} placeholder="https://twitter.com/cosscloudsol" />
          </SiteField>
          <SiteField label="WhatsApp">
            <input className={inp} value={siteSettings.whatsappNumber ?? ''} onChange={(e) => setSetting('whatsappNumber', e.target.value)} placeholder="+91 98765 43210" />
          </SiteField>
        </div>
      </SiteSection>

      {/* Section 4 — Organisation details */}
      <SiteSection icon="🏢" title="Organisation Details" desc="Legal name, GST, founding year, and Google Maps">
        <div className="grid grid-cols-2 gap-4">
          <SiteField label="Organisation Name">
            <input className={inp} value={siteSettings.orgName ?? ''} onChange={(e) => setSetting('orgName', e.target.value)} placeholder="Coss Cloud Solutions" />
          </SiteField>
          <SiteField label="Legal Name">
            <input className={inp} value={siteSettings.orgLegalName ?? ''} onChange={(e) => setSetting('orgLegalName', e.target.value)} placeholder="Coss Cloud Solutions Pvt Ltd" />
          </SiteField>
          <SiteField label="Founded Year">
            <input className={inp} value={siteSettings.orgFoundedYear ?? ''} onChange={(e) => setSetting('orgFoundedYear', e.target.value)} placeholder="2009" />
          </SiteField>
          <SiteField label="GST Number">
            <input className={inp} value={siteSettings.orgGstNumber ?? ''} onChange={(e) => setSetting('orgGstNumber', e.target.value)} placeholder="36XXXXXXXXXXXZ" />
          </SiteField>
        </div>
        <SiteField label="Google Maps URL">
          <input className={inp} value={siteSettings.googleMapsUrl ?? ''} onChange={(e) => setSetting('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/?cid=..." />
        </SiteField>
      </SiteSection>
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────

type AdminRole = 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  changePassword: boolean;
}

type ToastType = 'success' | 'error';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  ADMISSIONS_SALES: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  SUPPORT_HELPDESK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMISSIONS_SALES', 'SUPPORT_HELPDESK'];

function blankForm(): FormState {
  return {
    name: '',
    email: '',
    password: '',
    role: 'ADMISSIONS_SALES',
    permissions: [...(ROLE_PERMISSIONS['ADMISSIONS_SALES'] as Permission[])],
    isActive: true,
    changePassword: false,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      className={[
        'fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-lg',
        type === 'success'
          ? 'bg-teal-600 text-white'
          : 'bg-red-600 text-white',
      ].join(' ')}
    >
      {type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {message}
    </div>
  );
}

function RoleDropdown({
  value,
  onChange,
}: {
  value: AdminRole;
  onChange: (role: AdminRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      >
        <span>{ROLE_LABELS[value]}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
          {ROLES.map((role) => (
            <li key={role}>
              <button
                type="button"
                onClick={() => {
                  onChange(role);
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                  role === value ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-700 dark:text-gray-300',
                ].join(' ')}
              >
                {role === value && <Check className="h-3.5 w-3.5" />}
                <span className={role === value ? '' : 'ml-5'}>{ROLE_LABELS[role]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PermissionsGrid({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (perms: string[]) => void;
}) {
  function toggle(key: Permission) {
    if (selected.includes(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-4">
            {group.permissions.map(({ key, label }) => {
              const checked = selected.includes(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-1.5 select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(key)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── User Modal ──────────────────────────────────────────────────────────────

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSave: (data: Omit<FormState, 'changePassword'> & { id?: string }) => Promise<void>;
}) {
  const isEdit = user !== null;
  const [form, setForm] = useState<FormState>(() => {
    if (!user) return blankForm();
    return {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      permissions: [...user.permissions],
      isActive: user.isActive,
      changePassword: false,
    };
  });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleRoleChange(role: AdminRole) {
    setField('role', role);
    setField('permissions', [...(ROLE_PERMISSIONS[role] as Permission[])]);
  }

  function selectAllForRole() {
    setField('permissions', [...ALL_PERMISSIONS]);
  }

  function clearAll() {
    setField('permissions', []);
  }

  async function handleSubmit() {
    setLocalError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setLocalError('Name and email are required.');
      return;
    }
    if (!isEdit && !form.password) {
      setLocalError('Password is required for new users.');
      return;
    }
    if (form.changePassword && form.password.length > 0 && form.password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        permissions: form.permissions,
        isActive: form.isActive,
      };
      if (!isEdit) payload.password = form.password;
      else if (form.changePassword && form.password) payload.password = form.password;
      if (isEdit) payload.id = user.id;

      await onSave(payload as Omit<FormState, 'changePassword'> & { id?: string });
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  }

  // Trap focus and close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Team Member' : 'Invite Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {localError && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {localError}
            </p>
          )}

          {/* Name & Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Arjun Mehta"
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="arjun@cosscloudsol.com"
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          {/* Password */}
          {!isEdit ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.changePassword}
                  onChange={(e) => setField('changePassword', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Change password
                </span>
              </label>
              {form.changePassword && (
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="New password (min. 8 characters)"
                  autoComplete="new-password"
                  className="mt-2 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              )}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <RoleDropdown value={form.role} onChange={handleRoleChange} />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Selecting a role auto-fills the recommended permissions below. You can customise further.
            </p>
          </div>

          {/* Permissions */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Permissions
              </label>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={selectAllForRole}
                  className="text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
            <PermissionsGrid
              selected={form.permissions}
              onChange={(perms) => setField('permissions', perms)}
            />
          </div>

          {/* Active toggle */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() => setField('isActive', !form.isActive)}
                className={[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
                  form.isActive ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                    form.isActive ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {form.isActive ? 'Account active' : 'Account inactive — user cannot log in'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────

function DeleteDialog({
  user,
  onConfirm,
  onClose,
  deleting,
}: {
  user: AdminUser;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Remove team member?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          <strong className="text-gray-800 dark:text-gray-200">{user.name}</strong> ({user.email})
          will be permanently removed. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role info cards ─────────────────────────────────────────────────────────

const ROLE_INFO = [
  {
    role: 'ADMISSIONS_SALES' as AdminRole,
    title: 'Admissions & Sales Team',
    scope: 'Management of the initial enrolment funnel.',
    tasks: [
      'Captures incoming inquiries and tracks lead statuses',
      'Logs communication histories and schedules follow-ups',
      'Pushes leads to "enrolled" status',
    ],
    access: 'Edit rights for leads and contacts; visibility restricted to assigned batches and pipelines.',
    color: 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20',
    badge: 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/40',
  },
  {
    role: 'SUPPORT_HELPDESK' as AdminRole,
    title: 'Support / Helpdesk',
    scope: 'Post-enrollment student satisfaction and retention.',
    tasks: [
      'Logs, categorises, and tracks student issues to resolution',
      'Routes complex issues to Finance or IT',
      'Updates FAQ articles and self-help guides',
      'Sends and compiles student satisfaction surveys',
    ],
    access: 'Edit rights for support tickets and feedback; read-only on student info; no access to raw sales leads.',
    color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    badge: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40',
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage(): JSX.Element {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const d: unknown = await res.json().catch(() => ({}));
        throw new Error(
          typeof d === 'object' && d !== null && 'error' in d
            ? String((d as { error: unknown }).error)
            : 'Failed to load users',
        );
      }
      const data: { users: AdminUser[] } = await res.json();
      setUsers(data.users);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleSave(
    data: Omit<FormState, 'changePassword'> & { id?: string },
  ): Promise<void> {
    const { id, ...rest } = data;

    if (id) {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const d: unknown = await res.json().catch(() => ({}));
        throw new Error(
          typeof d === 'object' && d !== null && 'error' in d
            ? String((d as { error: unknown }).error)
            : 'Update failed',
        );
      }
      const saved: { user: AdminUser } = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? saved.user : u)));
      showToast('User updated successfully.');
    } else {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const d: unknown = await res.json().catch(() => ({}));
        throw new Error(
          typeof d === 'object' && d !== null && 'error' in d
            ? String((d as { error: unknown }).error)
            : 'Create failed',
        );
      }
      const created: { user: AdminUser } = await res.json();
      setUsers((prev) => [...prev, created.user]);
      showToast('Team member added successfully.');
    }

    setModal(null);
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d: unknown = await res.json().catch(() => ({}));
        throw new Error(
          typeof d === 'object' && d !== null && 'error' in d
            ? String((d as { error: unknown }).error)
            : 'Delete failed',
        );
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      showToast('Team member removed.');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleToggle(userId: string) {
    setToggling(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, { method: 'PATCH' });
      const data: unknown = await res.json().catch(() => ({}));
      if (res.ok && typeof data === 'object' && data !== null && 'isActive' in data) {
        const { isActive } = data as { isActive: boolean };
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive } : u)));
        showToast(isActive ? 'User enabled.' : 'User disabled.');
      } else {
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as { error: unknown }).error)
            : 'Failed to update status';
        showToast(msg, 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
          <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Site contact details, branch hours, social links, and team access permissions.
          </p>
        </div>
      </div>

      {/* ── Site Settings ─────────────────────────────────────────────────── */}
      <SiteSettingsPanel />

      {/* ── Team Management divider ──────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Management</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage team members, roles, and panel access permissions.
        </p>
      </div>

      {/* Role reference cards */}
      <section aria-labelledby="roles-heading">
        <h2
          id="roles-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          Available Roles
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ROLE_INFO.map((info) => (
            <div
              key={info.role}
              className={`rounded-xl border p-5 ${info.color}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.badge}`}>
                  {ROLE_LABELS[info.role]}
                </span>
              </div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400 italic">{info.scope}</p>
              <ul className="mb-3 space-y-1">
                {info.tasks.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong className="text-gray-600 dark:text-gray-300">Access: </strong>
                {info.access}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team members table */}
      <section aria-labelledby="team-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="team-heading"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Team Members
          </h2>
          <button
            onClick={() => {
              setEditTarget(null);
              setModal('create');
            }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Invite User
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-3" />
              <span className="text-sm">Loading team members…</span>
            </div>
          ) : fetchError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-red-500 dark:text-red-400">{fetchError}</p>
              <button
                onClick={fetchUsers}
                className="mt-3 text-sm text-teal-600 dark:text-teal-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No team members yet. Click <strong>Invite User</strong> to add one.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Name', 'Email', 'Role', 'Permissions', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors${!u.isActive ? ' opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Added {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {u.email}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[u.role]}`}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {u.permissions.length} / {ALL_PERMISSIONS.length}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={u.isActive}
                          onClick={() => handleToggle(u.id)}
                          disabled={toggling === u.id}
                          title={u.isActive ? 'Click to disable' : 'Click to enable'}
                          className={[
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                            u.isActive ? 'bg-teal-500' : 'bg-gray-400 dark:bg-gray-600',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                              u.isActive ? 'translate-x-5' : 'translate-x-0',
                            ].join(' ')}
                          />
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditTarget(u);
                            setModal('edit');
                          }}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                          title="Remove user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          The <strong>Super Admin</strong> account (env-var) is not listed here and cannot be managed from this panel.
        </p>
      </section>

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <UserModal
          user={modal === 'edit' ? editTarget : null}
          onClose={() => {
            setModal(null);
            setEditTarget(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
