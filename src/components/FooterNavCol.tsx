'use client'
import { useState } from 'react'
import Link from 'next/link'

interface NavLink {
  label: string
  href: string
}

export default function FooterNavCol({ title, links }: { title: string; links: NavLink[] }) {
  const [open, setOpen] = useState(false)
  const id = `fnc-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="footer-nav-col">
      <button
        className="footer-nav-summary"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        {title}
        <span className="footer-acc-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </button>
      <ul id={id} className={`footer-navcol-body${open ? ' open' : ''}`}>
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="footer-link">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
