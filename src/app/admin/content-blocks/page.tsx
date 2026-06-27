'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentBlock {
  id: string
  blockType: string
  page: string
  title: string
  body: string
  icon: string
  metadata: Record<string, unknown>
  gridStyle: string
  isVisible: boolean
  sortOrder: number
}

type GridStyle = 'card-stack' | 'horizontal' | 'image-hero'
type SettingsTab = 'content' | 'style' | 'seo' | 'advanced'

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_STYLES: Array<{ id: GridStyle; label: string; desc: string }> = [
  { id: 'card-stack',  label: 'Card stack',  desc: 'Image top, content below — 3 col grid' },
  { id: 'horizontal',  label: 'Horizontal',  desc: 'Image left, content right — list view'  },
  { id: 'image-hero',  label: 'Image hero',  desc: 'Full image with overlay text — portrait grid' },
]

const PAGES = [
  { id: 'home',      label: 'Home',      emoji: '🏠' },
  { id: 'about',     label: 'About',     emoji: 'ℹ️' },
  { id: 'courses',   label: 'Courses',   emoji: '📚' },
  { id: 'corporate', label: 'Corporate', emoji: '🏢' },
  { id: 'contact',   label: 'Contact',   emoji: '✉️' },
  { id: 'global',    label: 'All pages', emoji: '🌐' },
]

const BLOCK_TYPES = [
  { type: 'hero',         label: 'Hero'         },
  { type: 'feature',      label: 'Features'     },
  { type: 'faq',          label: 'FAQ'          },
  { type: 'timeline',     label: 'Timeline'     },
  { type: 'course-grid',  label: 'Courses'      },
  { type: 'blog-grid',    label: 'Blog'         },
  { type: 'testimonials', label: 'Testimonials' },
  { type: 'cta',          label: 'CTA'          },
]

const BLOCK_TYPE_COLORS: Record<string, string> = {
  hero:         'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  feature:      'bg-teal-500/20 text-teal-300 border-teal-500/30',
  faq:          'bg-amber-500/20 text-amber-300 border-amber-500/30',
  timeline:     'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'course-grid':'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'blog-grid':  'bg-green-500/20 text-green-300 border-green-500/30',
  testimonials: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  cta:          'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

// ─── Grid Style Selector ──────────────────────────────────────────────────────

function GridStyleSelector({ value, onChange }: { value: GridStyle; onChange: (v: GridStyle) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-2">Grid style</label>
      <div className="flex flex-col gap-2">
        {GRID_STYLES.map(style => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
              value === style.id
                ? 'border-teal-500/50 bg-teal-500/5'
                : 'border-white/10 bg-transparent hover:bg-gray-700'
            }`}
          >
            {/* Mini preview thumbnail */}
            <div className={`w-14 h-10 rounded flex-shrink-0 overflow-hidden border ${
              value === style.id ? 'border-teal-500/30' : 'border-white/10'
            }`}>
              {style.id === 'card-stack' && (
                <div className="w-full h-full bg-gray-700 grid grid-cols-3 gap-0.5 p-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="bg-gray-600 rounded-sm flex flex-col">
                      <div className="h-1/2 bg-gray-500 rounded-t-sm" />
                    </div>
                  ))}
                </div>
              )}
              {style.id === 'horizontal' && (
                <div className="w-full h-full bg-gray-700 flex flex-col gap-0.5 p-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex-1 bg-gray-600 rounded-sm flex gap-0.5">
                      <div className="w-1/3 bg-gray-500 rounded-l-sm" />
                    </div>
                  ))}
                </div>
              )}
              {style.id === 'image-hero' && (
                <div className="w-full h-full bg-gray-700 grid grid-cols-3 gap-0.5 p-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="bg-gray-500 rounded-sm relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/60" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${value === style.id ? 'text-teal-400' : 'text-gray-200'}`}>
                {style.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{style.desc}</p>
            </div>
            {value === style.id && (
              <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Block Live Preview ───────────────────────────────────────────────────────

function BlockPreview({ block }: { block: ContentBlock }) {
  const t = block.blockType
  if (t === 'hero') return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 text-center">
      <div className="text-lg font-bold text-white mb-1">{block.title || 'Hero Heading'}</div>
      <div className="text-xs text-gray-400 mb-3">{block.body || 'Subheading text goes here'}</div>
      <div className="flex gap-2 justify-center">
        <span className="px-3 py-1 text-xs bg-teal-600 text-white rounded">Primary CTA</span>
        <span className="px-3 py-1 text-xs border border-white/20 text-gray-300 rounded">Secondary</span>
      </div>
    </div>
  )
  if (t === 'feature') return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-gray-700/50 rounded-lg p-2 text-center">
          <div className="w-6 h-6 bg-teal-500/20 rounded mx-auto mb-1" />
          <div className="text-xs text-gray-300">Feature {i + 1}</div>
        </div>
      ))}
    </div>
  )
  if (t === 'faq') return (
    <div className="space-y-1.5">
      {[block.title || 'Question 1', 'Question 2', 'Question 3'].map((q, i) => (
        <div key={i} className="bg-gray-700/50 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-300 truncate">{q}</span>
          <span className="text-gray-500 text-xs ml-2">▼</span>
        </div>
      ))}
    </div>
  )
  if (t === 'timeline') return (
    <div className="relative pl-4">
      <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-600" />
      {[block.title || '2010', '2016', '2020'].map((yr, i) => (
        <div key={i} className="relative mb-2 pl-3">
          <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-xs font-bold text-teal-400">{yr}</span>
          <p className="text-xs text-gray-400">{i === 0 ? (block.body?.slice(0, 40) || 'Event text') : `Event ${i + 1}`}</p>
        </div>
      ))}
    </div>
  )
  if (t === 'course-grid') {
    const gs = block.gridStyle
    if (gs === 'horizontal') return (
      <div className="space-y-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-2 bg-gray-700/50 rounded p-1.5">
            <div className="w-12 h-8 bg-gray-600 rounded flex-shrink-0" />
            <div className="flex-1"><div className="text-xs text-gray-300">Course title</div><div className="text-xs text-gray-500">Category</div></div>
          </div>
        ))}
      </div>
    )
    if (gs === 'image-hero') return (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-600 rounded h-14 relative overflow-hidden">
            <div className="absolute inset-0 flex items-end p-1"><span className="text-xs text-white">Course</span></div>
          </div>
        ))}
      </div>
    )
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-700/50 rounded overflow-hidden">
            <div className="h-8 bg-gray-600" />
            <div className="p-1.5"><div className="text-xs text-gray-300">Course {i + 1}</div></div>
          </div>
        ))}
      </div>
    )
  }
  if (t === 'blog-grid') {
    const gs = block.gridStyle
    if (gs === 'horizontal') return (
      <div className="space-y-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-2 bg-gray-700/50 rounded p-1.5">
            <div className="w-12 h-8 bg-gray-600 rounded flex-shrink-0" />
            <div className="flex-1"><div className="text-xs text-gray-300">Blog post title</div><div className="text-xs text-gray-500">5 min read</div></div>
          </div>
        ))}
      </div>
    )
    if (gs === 'image-hero') return (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-600 rounded h-14 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/60" />
            <div className="absolute bottom-1 left-1"><span className="text-xs text-white">Post</span></div>
          </div>
        ))}
      </div>
    )
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-700/50 rounded overflow-hidden">
            <div className="h-8 bg-gray-600" />
            <div className="p-1.5"><div className="text-xs text-gray-300">Post {i + 1}</div></div>
          </div>
        ))}
      </div>
    )
  }
  if (t === 'testimonials') return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex text-yellow-400 text-xs mb-1">★★★★★</div>
      <p className="text-xs text-gray-300 italic">&quot;{block.body?.slice(0, 60) || 'Student testimonial quote goes here...'}&quot;</p>
      <p className="text-xs text-gray-500 mt-1">— {block.title || 'Student Name'}</p>
    </div>
  )
  if (t === 'cta') return (
    <div className="bg-teal-700/40 border border-teal-600/30 rounded-lg p-4 text-center">
      <div className="text-sm font-bold text-white mb-1">{block.title || 'Ready to start?'}</div>
      <div className="text-xs text-teal-200 mb-3">{block.body?.slice(0, 50) || 'Join thousands of students'}</div>
      <span className="px-3 py-1 text-xs bg-teal-500 text-white rounded">Enroll Now</span>
    </div>
  )
  return (
    <div className="bg-gray-700/30 rounded p-3 text-xs text-gray-400 text-center">
      {block.blockType} block
    </div>
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({
  block,
  tab,
  onTabChange,
  editForm,
  onFormChange,
  onSave,
  saving,
  allBlocks,
  onDelete,
}: {
  block: ContentBlock
  tab: SettingsTab
  onTabChange: (t: SettingsTab) => void
  editForm: Partial<ContentBlock>
  onFormChange: (patch: Partial<ContentBlock>) => void
  onSave: () => void
  saving: boolean
  allBlocks: ContentBlock[]
  onDelete: () => void
}) {
  const meta = (editForm.metadata ?? block.metadata ?? {}) as Record<string, unknown>
  const patchMeta = (patch: Record<string, unknown>) =>
    onFormChange({ metadata: { ...meta, ...patch } })

  const colorClass = BLOCK_TYPE_COLORS[block.blockType] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'

  const inputCls = 'w-full bg-gray-700 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50'
  const labelCls = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <span className={`inline-block px-2 py-0.5 text-xs rounded border font-medium ${colorClass}`}>
          {block.blockType}
        </span>
        <p className="text-xs text-gray-400 mt-1.5 truncate">{block.title || '(untitled)'}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['content', 'style', 'seo', 'advanced'] as SettingsTab[]).map(t => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? 'text-teal-400 border-b-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── CONTENT TAB ── */}
        {tab === 'content' && (
          <>
            {/* Hero */}
            {block.blockType === 'hero' && (
              <>
                <div>
                  <label className={labelCls}>Heading</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="Hero heading" />
                </div>
                <div>
                  <label className={labelCls}>Subheading</label>
                  <textarea rows={3} className={inputCls + ' resize-none'} value={editForm.body ?? block.body} onChange={e => onFormChange({ body: e.target.value })} placeholder="Hero subheading text" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Primary CTA label</label>
                    <input className={inputCls} value={String(meta.primaryCtaLabel ?? '')} onChange={e => patchMeta({ primaryCtaLabel: e.target.value })} placeholder="Enroll Now" />
                  </div>
                  <div>
                    <label className={labelCls}>Primary CTA URL</label>
                    <input className={inputCls} value={String(meta.primaryCtaUrl ?? '')} onChange={e => patchMeta({ primaryCtaUrl: e.target.value })} placeholder="/enroll-now" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Secondary CTA label</label>
                    <input className={inputCls} value={String(meta.secondaryCtaLabel ?? '')} onChange={e => patchMeta({ secondaryCtaLabel: e.target.value })} placeholder="Free Demo" />
                  </div>
                  <div>
                    <label className={labelCls}>Secondary CTA URL</label>
                    <input className={inputCls} value={String(meta.secondaryCtaUrl ?? '')} onChange={e => patchMeta({ secondaryCtaUrl: e.target.value })} placeholder="/free-demo" />
                  </div>
                </div>
              </>
            )}

            {/* CTA */}
            {block.blockType === 'cta' && (
              <>
                <div>
                  <label className={labelCls}>Heading</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="CTA heading" />
                </div>
                <div>
                  <label className={labelCls}>Body text</label>
                  <textarea rows={3} className={inputCls + ' resize-none'} value={editForm.body ?? block.body} onChange={e => onFormChange({ body: e.target.value })} placeholder="Supporting text" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Button label</label>
                    <input className={inputCls} value={String(meta.buttonLabel ?? '')} onChange={e => patchMeta({ buttonLabel: e.target.value })} placeholder="Enroll Now" />
                  </div>
                  <div>
                    <label className={labelCls}>Button URL</label>
                    <input className={inputCls} value={String(meta.buttonUrl ?? '')} onChange={e => patchMeta({ buttonUrl: e.target.value })} placeholder="/enroll" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Background</label>
                  <select className={inputCls} value={String(meta.bgColor ?? 'teal-dark')} onChange={e => patchMeta({ bgColor: e.target.value })}>
                    <option value="teal-dark">Teal dark</option>
                    <option value="orange">Orange</option>
                    <option value="white">White</option>
                  </select>
                </div>
              </>
            )}

            {/* FAQ */}
            {block.blockType === 'faq' && (
              <>
                <div>
                  <label className={labelCls}>Question</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="FAQ question" />
                </div>
                <div>
                  <label className={labelCls}>Answer</label>
                  <textarea rows={4} className={inputCls + ' resize-none'} value={editForm.body ?? block.body} onChange={e => onFormChange({ body: e.target.value })} placeholder="FAQ answer" />
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">All FAQs on this page</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {allBlocks.filter(b => b.blockType === 'faq').map(b => (
                      <div key={b.id} className={`px-2 py-1.5 rounded text-xs truncate ${b.id === block.id ? 'bg-teal-500/10 text-teal-300' : 'text-gray-400 bg-gray-700/30'}`}>
                        {b.title || '(untitled)'}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            {block.blockType === 'timeline' && (
              <>
                <div>
                  <label className={labelCls}>Year</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="2024" />
                </div>
                <div>
                  <label className={labelCls}>Event description</label>
                  <textarea rows={3} className={inputCls + ' resize-none'} value={editForm.body ?? block.body} onChange={e => onFormChange({ body: e.target.value })} placeholder="Milestone event" />
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">All timeline entries</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {allBlocks.filter(b => b.blockType === 'timeline').map(b => (
                      <div key={b.id} className={`px-2 py-1.5 rounded text-xs truncate ${b.id === block.id ? 'bg-teal-500/10 text-teal-300' : 'text-gray-400 bg-gray-700/30'}`}>
                        <span className="font-bold mr-2">{b.title}</span>{b.body?.slice(0, 30)}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Feature */}
            {block.blockType === 'feature' && (
              <>
                <div>
                  <label className={labelCls}>Icon name</label>
                  <input className={inputCls} value={editForm.icon ?? block.icon} onChange={e => onFormChange({ icon: e.target.value })} placeholder="users" />
                </div>
                <div>
                  <label className={labelCls}>Feature title</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="Feature title" />
                </div>
              </>
            )}

            {/* Course grid / Blog grid */}
            {(block.blockType === 'course-grid' || block.blockType === 'blog-grid') && (
              <>
                <div>
                  <label className={labelCls}>Section heading</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="Section heading" />
                </div>
                <div>
                  <label className={labelCls}>Section subheading</label>
                  <textarea rows={2} className={inputCls + ' resize-none'} value={editForm.body ?? block.body} onChange={e => onFormChange({ body: e.target.value })} placeholder="Subheading text" />
                </div>
                <div>
                  <label className={labelCls}>Items to show</label>
                  <input type="number" min={1} max={12} className={inputCls} value={Number(meta.limit ?? 6)} onChange={e => patchMeta({ limit: Number(e.target.value) })} />
                </div>
                <GridStyleSelector
                  value={(editForm.gridStyle ?? block.gridStyle ?? 'card-stack') as GridStyle}
                  onChange={v => onFormChange({ gridStyle: v })}
                />
                {block.blockType === 'course-grid' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showPrice ?? true)} onChange={e => patchMeta({ showPrice: e.target.checked })} />
                      Show price
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showEnrollCount ?? true)} onChange={e => patchMeta({ showEnrollCount: e.target.checked })} />
                      Show enroll count
                    </label>
                  </div>
                )}
                {block.blockType === 'blog-grid' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showAuthor ?? true)} onChange={e => patchMeta({ showAuthor: e.target.checked })} />
                      Show author
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showReadTime ?? true)} onChange={e => patchMeta({ showReadTime: e.target.checked })} />
                      Show read time
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Testimonials */}
            {block.blockType === 'testimonials' && (
              <>
                <div>
                  <label className={labelCls}>Name / attribution</label>
                  <input className={inputCls} value={editForm.title ?? block.title} onChange={e => onFormChange({ title: e.target.value })} placeholder="Student Name" />
                </div>
                <div>
                  <label className={labelCls}>Quote</label>
                  <textarea rows={4} className={inputCls + ' resize-none'} value={editForm.body ?? block.body} onChange={e => onFormChange({ body: e.target.value })} placeholder="Student testimonial quote" />
                </div>
              </>
            )}
          </>
        )}

        {/* ── STYLE TAB ── */}
        {tab === 'style' && (
          <>
            <div>
              <label className={labelCls}>Background</label>
              <select className={inputCls} value={String(meta.background ?? 'transparent')} onChange={e => patchMeta({ background: e.target.value })}>
                <option value="transparent">Transparent</option>
                <option value="white">White</option>
                <option value="light-grey">Light grey</option>
                <option value="dark-teal">Dark teal</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Padding</label>
              <select className={inputCls} value={String(meta.padding ?? 'normal')} onChange={e => patchMeta({ padding: e.target.value })}>
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>
            {(block.blockType === 'course-grid' || block.blockType === 'blog-grid') && (
              <>
                <div>
                  <label className={labelCls}>Columns</label>
                  <select className={inputCls} value={String(meta.columns ?? '3')} onChange={e => patchMeta({ columns: e.target.value })}>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Alignment</label>
                  <select className={inputCls} value={String(meta.alignment ?? 'center')} onChange={e => patchMeta({ alignment: e.target.value })}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showHeading ?? true)} onChange={e => patchMeta({ showHeading: e.target.checked })} />
                Show section heading
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showSubheading ?? true)} onChange={e => patchMeta({ showSubheading: e.target.checked })} />
                Show subheading
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.showCtaButtons ?? true)} onChange={e => patchMeta({ showCtaButtons: e.target.checked })} />
                Show CTA buttons
              </label>
            </div>
            <div>
              <label className={labelCls}>Custom CSS class</label>
              <input className={inputCls} value={String(meta.customClass ?? '')} onChange={e => patchMeta({ customClass: e.target.value })} placeholder="my-section" />
            </div>
          </>
        )}

        {/* ── SEO TAB ── */}
        {tab === 'seo' && (
          <>
            <div>
              <label className={labelCls}>Schema type</label>
              <select className={inputCls} value={String(meta.schemaType ?? 'None')} onChange={e => patchMeta({ schemaType: e.target.value })}>
                <option value="None">None</option>
                <option value="FAQPage">FAQPage</option>
                <option value="HowTo">HowTo</option>
                <option value="ItemList">ItemList</option>
                <option value="CourseInstance">CourseInstance</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Anchor ID</label>
              <input className={inputCls} value={String(meta.anchorId ?? '')} onChange={e => patchMeta({ anchorId: e.target.value })} placeholder="faq-section" />
            </div>
            <div>
              <label className={labelCls}>ARIA label</label>
              <input className={inputCls} value={String(meta.ariaLabel ?? '')} onChange={e => patchMeta({ ariaLabel: e.target.value })} placeholder="FAQ section" />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.includeInSitemap ?? true)} onChange={e => patchMeta({ includeInSitemap: e.target.checked })} />
                Include in sitemap
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.visibleToSearch ?? true)} onChange={e => patchMeta({ visibleToSearch: e.target.checked })} />
                Visible to search engines
              </label>
            </div>
          </>
        )}

        {/* ── ADVANCED TAB ── */}
        {tab === 'advanced' && (
          <>
            <div>
              <label className={labelCls}>Block ID (readonly)</label>
              <input className={inputCls + ' opacity-50 cursor-not-allowed'} readOnly value={block.id} />
            </div>
            <div>
              <label className={labelCls}>Page assignment</label>
              <select className={inputCls} value={editForm.page ?? block.page} onChange={e => onFormChange({ page: e.target.value })}>
                {PAGES.filter(p => p.id !== 'global').map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sort order</label>
              <input type="number" className={inputCls} value={editForm.sortOrder ?? block.sortOrder} onChange={e => onFormChange({ sortOrder: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.visibleDesktop ?? true)} onChange={e => patchMeta({ visibleDesktop: e.target.checked })} />
                Visible on desktop
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-teal-500" checked={Boolean(meta.visibleMobile ?? true)} onChange={e => patchMeta({ visibleMobile: e.target.checked })} />
                Visible on mobile
              </label>
            </div>
            <div>
              <label className={labelCls}>Course slug lock</label>
              <input className={inputCls} value={String(meta.courseSlugLock ?? '')} onChange={e => patchMeta({ courseSlugLock: e.target.value })} placeholder="aws-training-in-hyderabad" />
            </div>
            <button
              onClick={onDelete}
              className="w-full mt-2 px-3 py-2 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Delete block
            </button>
          </>
        )}
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2 text-sm font-medium bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save block'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentBlocksPage() {
  const [blocks, setBlocks]                   = useState<ContentBlock[]>([])
  const [activePage, setActivePage]           = useState('home')
  const [selectedId, setSelectedId]           = useState<string | null>(null)
  const [activeTab, setActiveTab]             = useState<SettingsTab>('content')
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [draftChanges, setDraftChanges]       = useState(false)
  const [editForm, setEditForm]               = useState<Partial<ContentBlock>>({})
  const [toast, setToast]                     = useState<string | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [mounted, setMounted]                 = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const fetchBlocks = useCallback(async () => {
    setLoading(true)
    const qs = activePage === 'global' ? '' : `?page=${activePage}`
    fetch(`/api/admin/content-blocks${qs}`)
      .then(r => r.json())
      .then((data: ContentBlock[]) => {
        setBlocks(data)
        setSelectedId(null)
        setEditForm({})
      })
      .catch(() => showToast('Failed to load blocks'))
      .finally(() => setLoading(false))
  }, [activePage, showToast])

  // Fetch blocks when active page changes
  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setEditForm({})
    setActiveTab('content')
  }

  const handleFormChange = (patch: Partial<ContentBlock>) => {
    setEditForm(prev => ({ ...prev, ...patch }))
    setDraftChanges(true)
  }

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content-blocks/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated: ContentBlock = await res.json()
      setBlocks(prev => prev.map(b => b.id === selectedId ? updated : b))
      setEditForm({})
      setDraftChanges(false)
      showToast('Block saved')
    } catch {
      showToast('Failed to save block')
    } finally {
      setSaving(false)
    }
  }

  const handleAddBlock = async (blockType: string) => {
    try {
      const targetPage = activePage === 'global' ? 'home' : activePage
      const res = await fetch('/api/admin/content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType,
          page: targetPage,
          title: `New ${blockType}`,
          sortOrder: blocks.length + 1,
        }),
      })
      if (!res.ok) throw new Error('Create failed')
      const created: ContentBlock = await res.json()
      setBlocks(prev => [...prev, created])
      setSelectedId(created.id)
      setEditForm({})
      setActiveTab('content')
      showToast(`${blockType} block added`)
    } catch {
      showToast('Failed to add block')
    }
  }

  const handleDelete = async (blockId?: string) => {
    const id = blockId ?? selectedId
    if (!id) return
    if (!confirm('Delete this block? This cannot be undone.')) return

    // Optimistic UI — remove immediately, revert on failure
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
      setEditForm({})
    }

    try {
      const res = await fetch(`/api/admin/content-blocks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(`Delete failed: ${data.error ?? res.status}`)
        fetchBlocks()
      } else {
        showToast('Block deleted')
      }
    } catch {
      showToast('Network error — block may not have been deleted')
      fetchBlocks()
    }
  }

  const handleToggleVisible = async (block: ContentBlock) => {
    try {
      const res = await fetch(`/api/admin/content-blocks/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !block.isVisible }),
      })
      if (!res.ok) throw new Error()
      const updated: ContentBlock = await res.json()
      setBlocks(prev => prev.map(b => b.id === block.id ? updated : b))
    } catch {
      showToast('Toggle failed')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newBlocks = [...blocks]
    ;[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]
    setBlocks(newBlocks)
    await fetch('/api/admin/content-blocks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newBlocks.map(b => b.id) }),
    })
  }

  const handleMoveDown = async (index: number) => {
    if (index === blocks.length - 1) return
    const newBlocks = [...blocks]
    ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
    setBlocks(newBlocks)
    await fetch('/api/admin/content-blocks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newBlocks.map(b => b.id) }),
    })
  }

  const handlePublish = async () => {
    await fetch('/api/admin/content-blocks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: blocks.map(b => b.id) }),
    })
    setDraftChanges(false)
    showToast('Published — order saved')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-white/10 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-teal-600 rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold">Content blocks editor</span>
            <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">Coss IMS</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {draftChanges && <span className="text-xs text-amber-400">● Unsaved changes</span>}
          <button
            onClick={handlePublish}
            className="px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors"
          >
            Publish order
          </button>
        </div>
      </header>

      {/* ── Desktop layout (lg+) ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] flex-shrink-0 border-r border-white/10 bg-gray-900 flex flex-col overflow-hidden">
          {/* Pages */}
          <div className="p-3 border-b border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Pages</p>
            <ul className="space-y-0.5">
              {PAGES.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => setActivePage(p.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activePage === p.id
                        ? 'bg-teal-600/20 text-teal-300'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                    {activePage === p.id && (
                      <span className="ml-auto text-xs text-gray-500">{blocks.length}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Block type library */}
          <div className="p-3 border-b border-white/10 flex-1 overflow-y-auto">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Add block</p>
            <div className="flex flex-col gap-1.5">
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.type}
                  onClick={() => handleAddBlock(bt.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    BLOCK_TYPE_COLORS[bt.type]?.includes('teal') ? 'bg-teal-400' :
                    BLOCK_TYPE_COLORS[bt.type]?.includes('indigo') ? 'bg-indigo-400' :
                    BLOCK_TYPE_COLORS[bt.type]?.includes('amber') ? 'bg-amber-400' :
                    BLOCK_TYPE_COLORS[bt.type]?.includes('purple') ? 'bg-purple-400' :
                    BLOCK_TYPE_COLORS[bt.type]?.includes('blue') ? 'bg-blue-400' :
                    BLOCK_TYPE_COLORS[bt.type]?.includes('green') ? 'bg-green-400' :
                    BLOCK_TYPE_COLORS[bt.type]?.includes('pink') ? 'bg-pink-400' : 'bg-orange-400'
                  }`} />
                  + {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Stats</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total blocks</span>
                <span className="text-gray-300">{blocks.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Visible</span>
                <span className="text-teal-400">{blocks.filter(b => b.isVisible).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Hidden</span>
                <span className="text-gray-500">{blocks.filter(b => !b.isVisible).length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center canvas */}
        <main className="flex-1 overflow-y-auto p-5 bg-gray-950">
          {/* Page header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-semibold text-white capitalize">
                {PAGES.find(p => p.id === activePage)?.label ?? activePage} blocks
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading blocks...</div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-xl mb-4 flex items-center justify-center text-2xl">📦</div>
              <p className="text-gray-400 text-sm">No blocks on this page</p>
              <p className="text-gray-600 text-xs mt-1">Click a block type in the sidebar to add one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, index) => {
                const isSelected = block.id === selectedId
                const colorClass = BLOCK_TYPE_COLORS[block.blockType] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                return (
                  <div
                    key={block.id}
                    onClick={() => handleSelect(block.id)}
                    className={`group rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500/50 bg-gray-800 shadow-lg shadow-teal-500/5'
                        : 'border-white/8 bg-gray-900 hover:border-white/20 hover:bg-gray-800'
                    } ${!block.isVisible ? 'opacity-50' : ''}`}
                  >
                    {/* Card toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colorClass}`}>
                          {block.blockType}
                        </span>
                        <span className="text-xs text-gray-400 truncate max-w-[180px]">
                          {block.title || '(untitled)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Move up */}
                        <button
                          onClick={e => { e.stopPropagation(); handleMoveUp(index) }}
                          disabled={index === 0}
                          className="p-1 rounded text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                          title="Move up"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </button>
                        {/* Move down */}
                        <button
                          onClick={e => { e.stopPropagation(); handleMoveDown(index) }}
                          disabled={index === blocks.length - 1}
                          className="p-1 rounded text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                          title="Move down"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {/* Toggle visibility */}
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleVisible(block) }}
                          className={`p-1 rounded transition-colors ${block.isVisible ? 'text-teal-400 hover:text-teal-300' : 'text-gray-600 hover:text-gray-400'}`}
                          title={block.isVisible ? 'Hide block' : 'Show block'}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {block.isVisible
                              ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                              : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                            }
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(block.id) }}
                          className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete block"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                        <span className="text-xs text-gray-600 ml-1">#{index + 1}</span>
                      </div>
                    </div>

                    {/* Live preview */}
                    <div className="p-4">
                      <BlockPreview block={block} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* Right settings panel */}
        <aside className="w-[280px] flex-shrink-0 border-l border-white/10 bg-gray-900 flex flex-col overflow-hidden">
          {selectedBlock ? (
            <SettingsPanel
              block={selectedBlock}
              tab={activeTab}
              onTabChange={setActiveTab}
              editForm={editForm}
              onFormChange={handleFormChange}
              onSave={handleSave}
              saving={saving}
              allBlocks={blocks}
              onDelete={handleDelete}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-10 h-10 bg-gray-800 rounded-xl mb-3 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Select a block</p>
              <p className="text-xs text-gray-600 mt-1">Click any block on the canvas to edit its settings</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Mobile layout (< lg) ── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Page selector dropdown */}
        <div className="p-3 border-b border-white/10 flex-shrink-0">
          <select
            value={activePage}
            onChange={e => setActivePage(e.target.value)}
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 appearance-none"
          >
            {PAGES.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
            ))}
          </select>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading blocks...</div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-xl mb-4 flex items-center justify-center text-2xl">📦</div>
              <p className="text-gray-400 text-sm">No blocks on this page</p>
              <p className="text-gray-600 text-xs mt-1">Tap a block type below to add one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map(block => {
                const colorClass = BLOCK_TYPE_COLORS[block.blockType] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                return (
                  <div
                    key={block.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      selectedId === block.id
                        ? 'border-teal-500/50 bg-gray-800'
                        : 'border-white/8 bg-gray-900'
                    } ${!block.isVisible ? 'opacity-50' : ''}`}
                  >
                    {/* Drag handle */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 flex-shrink-0">
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                      <line x1="8" y1="18" x2="16" y2="18" />
                    </svg>

                    {/* Block info */}
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium ${colorClass}`}>
                        {block.blockType}
                      </span>
                      <p className="text-xs text-gray-300 truncate mt-1">{block.title || '(untitled)'}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Toggle visibility */}
                      <button
                        onClick={() => handleToggleVisible(block)}
                        className={`p-1.5 rounded transition-colors ${block.isVisible ? 'text-teal-400' : 'text-gray-600'}`}
                        title={block.isVisible ? 'Hide block' : 'Show block'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {block.isVisible
                            ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                            : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                          }
                        </svg>
                      </button>
                      {/* Edit settings → opens bottom sheet */}
                      <button
                        onClick={() => { handleSelect(block.id); setMobileSheetOpen(true) }}
                        className="px-2.5 py-1 text-xs text-teal-400 border border-teal-500/30 rounded-md hover:bg-teal-500/10 transition-colors whitespace-nowrap"
                      >
                        Edit settings
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add block pill row */}
        <div className="flex-shrink-0 border-t border-white/10 px-3 py-2.5">
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {BLOCK_TYPES.map(bt => (
              <button
                key={bt.type}
                onClick={() => handleAddBlock(bt.type)}
                className="flex-shrink-0 px-3 py-1.5 text-xs text-gray-300 border border-white/10 rounded-full hover:bg-gray-800 hover:text-white transition-colors whitespace-nowrap"
              >
                + {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom sheet portal */}
        {mounted && mobileSheetOpen && selectedBlock && createPortal(
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileSheetOpen(false)}
            />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-gray-900 flex flex-col" style={{ maxHeight: '85vh' }}>
              {/* Sheet header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                <p className="text-sm font-medium text-white">Edit block</p>
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors text-lg leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {/* Sheet content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <SettingsPanel
                  block={selectedBlock}
                  tab={activeTab}
                  onTabChange={setActiveTab}
                  editForm={editForm}
                  onFormChange={handleFormChange}
                  onSave={handleSave}
                  saving={saving}
                  allBlocks={blocks}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  )
}
