'use client'

import { useState } from 'react'
import Link from 'next/link'

type CategoryData = {
  id: string
  name: string
  slug: string
  description: string | null
  courseCount: number
  accent: string
  icon: string
}

type GroupData = {
  id: string
  label: string
  icon: string
  color: string
  iconBg: string
  slugs: string[]
  categories: CategoryData[]
  totalCourses: number
}

type Props = {
  groups: GroupData[]
  allCategories: CategoryData[]
  totalCourses: number
  totalCategories: number
}

const GROUP_EMOJI: Record<string, string> = {
  'chart-bar': '📊',
  'cloud':     '☁️',
  'code':      '💻',
  'building':  '🏢',
  'palette':   '🎨',
}

export default function CoursesTabPage({
  groups,
  allCategories: _allCategories,
  totalCourses,
  totalCategories,
}: Props) {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
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
              { value: `${totalCategories}`, label: 'Categories' },
              { value: '100%', label: 'Placement support' },
              { value: '15+', label: 'Years experience' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold text-orange-500">{s.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              All courses
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'all'
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {totalCategories}
              </span>
            </button>

            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === group.id
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {group.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === group.id
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {group.categories.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ALL VIEW */}
        {activeTab === 'all' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
              {totalCourses}+ courses across {totalCategories} categories — click any group to explore
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map(group => (
                <div
                  key={group.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                        style={{ background: group.iconBg, color: group.color }}
                      >
                        {GROUP_EMOJI[group.icon] ?? '📚'}
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {group.label}
                        </h2>
                        <p className="text-xs text-gray-400">
                          {group.totalCourses} courses · {group.categories.length} categories
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab(group.id)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                    >
                      View all →
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {group.categories.map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/courses/${cat.slug}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{cat.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p
                                className="text-xs text-gray-400 mt-0.5"
                                style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                              >
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-400">{cat.courseCount} courses</span>
                          <span className="text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUP VIEWS */}
        {groups.map(group =>
          activeTab === group.id ? (
            <div key={group.id}>
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: group.iconBg, color: group.color }}
                >
                  {GROUP_EMOJI[group.icon] ?? '📚'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {group.label}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {group.categories.length} categories · {group.totalCourses} courses total
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.categories.map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/courses/${cat.slug}`}
                    className="group block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="h-1" style={{ background: cat.accent }} />

                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: group.iconBg }}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cat.courseCount} courses available
                          </p>
                        </div>
                      </div>

                      {cat.description && (
                        <p
                          className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {cat.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs text-gray-400">Hyderabad · Classroom</span>
                        <span className="text-sm font-semibold text-orange-500 group-hover:text-orange-600 transition-colors">
                          Explore Courses →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-10 bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
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
          ) : null
        )}

      </div>
    </div>
  )
}
