'use client';

import { usePathname, useRouter } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import type { NavGroup } from './navGroups';

interface MobileDrawerProps {
  group: NavGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileDrawer({ group, isOpen, onClose }: MobileDrawerProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { theme } = useTheme();
  const mode: 'dark' | 'light' = theme === 'dark' ? 'dark' : 'light';

  const groupColor = group?.color[mode];
  const GroupIcon = group?.icon;

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          isOpen
            ? 'bg-black/35 opacity-100 dark:bg-black/55'
            : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer panel — always in DOM so CSS transition plays on close */}
      <div
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-label={group ? `${group.label} navigation` : undefined}
        className={`fixed bottom-14 left-0 right-0 z-40 rounded-t-[20px] border-t border-[#d0d7de] bg-white pb-2 transition-transform duration-300 ease-out dark:border-[#30363d] dark:bg-[#161b22] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {group !== null && groupColor !== undefined && GroupIcon !== undefined && (
          <>
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5">
              <div className="h-[3px] w-8 rounded-full bg-[#d0d7de] dark:bg-[#30363d]" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 pt-2">
              <div
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]"
                style={{ backgroundColor: groupColor.bg }}
              >
                <GroupIcon size={16} style={{ color: groupColor.icon }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-tight text-gray-900 dark:text-white">
                  {group.label}
                </p>
                <p className="text-[10px] leading-tight text-gray-500 dark:text-[#8b949e]">
                  {group.items.length} {group.items.length === 1 ? 'section' : 'sections'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation drawer"
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 dark:text-[#8b949e] dark:hover:bg-[#1c2128]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-[#d0d7de] dark:border-[#30363d]" />

            {/* Items */}
            <ul className="max-h-[70vh] overflow-y-auto px-2 py-2">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const active = isItemActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                        active ? '' : 'hover:bg-[#f6f8fa] dark:hover:bg-[#1c2128]'
                      }`}
                      style={active ? { backgroundColor: groupColor.bg } : undefined}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                        style={{ backgroundColor: groupColor.bg }}
                      >
                        <ItemIcon size={18} style={{ color: groupColor.icon }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-medium leading-tight text-gray-900 dark:text-white"
                          style={active ? { color: groupColor.icon } : undefined}
                        >
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-tight text-gray-500 dark:text-[#8b949e]">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className={active ? '' : 'text-gray-400 dark:text-[#8b949e]'}
                        style={active ? { color: groupColor.icon } : undefined}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
