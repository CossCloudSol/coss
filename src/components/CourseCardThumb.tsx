'use client'
import Image from 'next/image'
import { useState } from 'react'

const DEAD_DOMAIN = 'nextjs.cosscloudsol.com'

interface Props {
  thumbnail: string | null
  title: string
  accentColor: string
}

export function CourseCardThumb({ thumbnail, title, accentColor }: Props) {
  const [errored, setErrored] = useState(false)

  const isDeadUrl = thumbnail?.includes(DEAD_DOMAIN)
  const showFallback = !thumbnail || errored || isDeadUrl

  if (showFallback) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: accentColor }}>
        <i className="ti ti-book" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.6)' }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <Image
      src={thumbnail}
      alt={title}
      fill
      style={{ objectFit: 'cover' }}
      sizes="(max-width: 768px) 100vw, 360px"
      onError={() => setErrored(true)}
    />
  )
}
