'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────

type CourseItem = {
  id: string
  title: string
  slug: string
  url: string
  urlType: string
  duration: string | null
  mode: string | null
  level: string | null
  badge: string | null
  price: number | null
  formattedPrice: string | null
  categorySlug: string | null
  description: string | null
  excerpt: string | null
}

type CategoryData = {
  id: string
  name: string
  slug: string
  description: string | null
  accent: string
  icon: string
  courses: CourseItem[]
  courseCount: number
}

type GroupData = {
  id: string
  label: string
  icon: string
  color: string
  iconBg: string
  categories: CategoryData[]
  totalCourses: number
}

type Props = {
  groups: GroupData[]
  totalCourses: number
  totalCategories: number
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CourseCard({ course, categoryName }: { course: CourseItem; categoryName: string }) {
  return (
    <Link
      href={course.url}
      className="group block rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Dark navy header — same as homepage Popular Courses cards */}
      <div className="bg-[#0f1f3d] p-4 flex flex-col gap-2.5 min-h-[130px]">
        {/* Badge */}
        {course.badge && (
          <span className="self-start bg-orange-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {course.badge}
          </span>
        )}
        {/* Title */}
        <h4
          className="text-white font-semibold text-sm leading-snug group-hover:text-orange-300 transition-colors"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {course.title}
        </h4>
        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {course.duration && (
            <span className="bg-white/10 text-white/85 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
              🕐 {course.duration}
            </span>
          )}
          {course.mode && (
            <span className="bg-white/10 text-white/85 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
              🏛 {course.mode}
            </span>
          )}
          {course.level && (
            <span className="bg-white/10 text-white/85 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
              📋 {course.level}
            </span>
          )}
        </div>
      </div>

      {/* White body */}
      <div className="bg-white dark:bg-gray-900 p-4 flex flex-col gap-3 flex-1">
        {/* Description */}
        {(course.description || course.excerpt) && (
          <p
            className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed"
            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {course.description || course.excerpt}
          </p>
        )}
        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-gray-900 dark:text-white font-bold text-base">
            {course.formattedPrice ?? 'Contact us'}
          </span>
          <span className="text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-lg transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Category Section ──────────────────────────────────────────────────────────

function CategorySection({ category }: { category: CategoryData }) {
  const [expanded, setExpanded] = useState(false)
  const INITIAL_COUNT = 4
  const visibleCourses = expanded ? category.courses : category.courses.slice(0, INITIAL_COUNT)
  const hiddenCount = category.courses.length - INITIAL_COUNT

  return (
    <div className="mb-8">
      {/* Category header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className="w-[3px] h-8 rounded-full flex-shrink-0"
            style={{ background: category.accent }}
          />
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-gray-100 dark:bg-gray-800"
          >
            {category.icon}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {category.name}
              <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {category.courseCount} courses
              </span>
            </h3>
            {category.description && (
              <p
                className="text-[11px] text-gray-400 mt-0.5"
                style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {category.description}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/courses/${category.slug}`}
          className="text-[11px] font-medium text-orange-500 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors whitespace-nowrap"
        >
          View category →
        </Link>
      </div>

      {/* 4-col course grid */}
      {visibleCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              categoryName={category.name}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic py-4">No courses yet in this category.</p>
      )}

      {/* Show more / less */}
      {hiddenCount > 0 && (
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-medium text-orange-500 border border-orange-200 dark:border-orange-800 px-4 py-1.5 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors whitespace-nowrap"
          >
            {expanded
              ? '− Show less'
              : `+ Show ${hiddenCount} more course${hiddenCount > 1 ? 's' : ''}`}
          </button>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
      )}
    </div>
  )
}

// ── Group Section ─────────────────────────────────────────────────────────────

const GROUP_EMOJI: Record<string, string> = {
  'data-ai':       '📊',
  'cloud-devops':  '☁️',
  'programming':   '💻',
  'business':      '🏢',
  'design-career': '🎨',
}

function GroupSection({ group }: { group: GroupData }) {
  return (
    <div className="mb-10">
      {/* Group heading bar */}
      <div
        className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border"
        style={{
          background: `linear-gradient(135deg, #0f172a 0%, ${group.color}22 100%)`,
          borderColor: `${group.color}40`,
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${group.color}25`, color: group.color }}
        >
          {GROUP_EMOJI[group.id] ?? '📚'}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {group.label}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {group.categories.length} categories · {group.totalCourses} courses
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
          style={{
            background: `${group.color}20`,
            color: group.color,
          }}
        >
          {group.categories.map(c => c.name.split(' ')[0]).join(' · ')}
        </span>
      </div>

      {group.categories.map(cat => (
        <CategorySection key={cat.slug} category={cat} />
      ))}
    </div>
  )
}

// ── Tab colours ───────────────────────────────────────────────────────────────

const TAB_COLORS: Record<string, string> = {
  all:            '#f97316',
  'data-ai':      '#7c3aed',
  'cloud-devops': '#0f766e',
  programming:    '#1d4ed8',
  business:       '#9f1239',
  'design-career':'#be185d',
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CoursesTabPage({ groups, totalCourses, totalCategories }: Props) {
  const [activeTab, setActiveTab] = useState('all')

  const activeGroup = groups.find(g => g.id === activeTab)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] py-14 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1 mb-4 tracking-wider uppercase">
            All Courses
          </span>
          <h1 className="text-3xl font-bold text-white mb-3">
            Find the right IT course for your career
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            {totalCourses}+ courses across {totalCategories} categories —
            Classroom training in Dilsukhnagar &amp; Ameerpet, Hyderabad
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { value: `${totalCourses}+`, label: 'Courses' },
              { value: `${totalCategories}`,  label: 'Categories' },
              { value: '100%',               label: 'Placement support' },
              { value: '15+',                label: 'Years experience' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold text-orange-500">{s.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-950 border-b-[1.5px] border-gray-200 dark:border-gray-800 shadow-sm">
        <div
          className="max-w-6xl mx-auto px-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-0 min-w-max">

            {/* All tab */}
            <button
              onClick={() => setActiveTab('all')}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-[2.5px]"
              style={{
                borderBottomColor: activeTab === 'all' ? TAB_COLORS.all : 'transparent',
                color: activeTab === 'all' ? '#111827' : '#1e293b',
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                style={{
                  background: TAB_COLORS.all,
                  transform: activeTab === 'all' ? 'scale(1.4)' : 'scale(1)',
                  filter: activeTab === 'all' ? `drop-shadow(0 0 4px ${TAB_COLORS.all})` : 'none',
                }}
              />
              All courses
              <span
                className="text-xs px-1.5 py-0.5 rounded-full transition-colors"
                style={
                  activeTab === 'all'
                    ? { background: '#fff3eb', color: '#c2410c' }
                    : { background: `${TAB_COLORS.all}18`, color: TAB_COLORS.all }
                }
              >
                {totalCategories}
              </span>
            </button>

            {/* Group tabs */}
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-[2.5px]"
                style={{
                  borderBottomColor: activeTab === group.id ? TAB_COLORS[group.id] : 'transparent',
                  color: activeTab === group.id ? '#111827' : '#1e293b',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                  style={{
                    background: TAB_COLORS[group.id] ?? '#6b7280',
                    transform: activeTab === group.id ? 'scale(1.4)' : 'scale(1)',
                    filter: activeTab === group.id ? `drop-shadow(0 0 4px ${TAB_COLORS[group.id] ?? '#6b7280'})` : 'none',
                  }}
                />
                {group.label}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full transition-colors"
                  style={
                    activeTab === group.id
                      ? { background: '#fff3eb', color: '#c2410c' }
                      : { background: `${TAB_COLORS[group.id]}18`, color: TAB_COLORS[group.id] }
                  }
                >
                  {group.categories.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ALL COURSES VIEW */}
        {activeTab === 'all' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
              {totalCourses}+ courses across {totalCategories} categories — scroll to browse everything
            </p>
            {groups.map((group, i) => (
              <div key={group.id}>
                <GroupSection group={group} />
                {i < groups.length - 1 && (
                  <hr className="border-dashed border-gray-200 dark:border-gray-800 my-8" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* INDIVIDUAL GROUP VIEW */}
        {activeTab !== 'all' && activeGroup && (
          <div>
            <GroupSection group={activeGroup} />

            {/* CTA strip */}
            <div className="mt-6 bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white font-semibold text-base">
                  Not sure which course to pick?
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Book a free demo class — our counsellors will guide you.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/free-demo-class"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Free Demo Class
                </Link>
                <Link
                  href="/enroll-now-with-coss"
                  className="px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
