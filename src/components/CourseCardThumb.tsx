'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { generateCourseThumbnailDataUri } from '@/lib/generate-thumbnail'

const DEAD_DOMAINS = [
  'localhost',
]

interface Props {
  thumbnail?: string | null
  title: string
  categoryName?: string
  categorySlug?: string | null
  categoryColor?: string | null
  tools?: string[]
  mode?: string | null
}

export function CourseCardThumb({
  thumbnail,
  title,
  categoryName = '',
  categorySlug,
  categoryColor,
  tools = [],
  mode,
}: Props) {
  const [errored, setErrored] = useState(false)
  const [svgUri, setSvgUri] = useState<string>('')

  const isDeadUrl = thumbnail
    ? DEAD_DOMAINS.some(d => thumbnail.includes(d))
    : false

  const showFallback = !thumbnail || errored || isDeadUrl

  useEffect(() => {
    if (showFallback) {
      const uri = generateCourseThumbnailDataUri(
        { title, categoryName, categoryColor, tools, mode },
        categorySlug
      )
      setSvgUri(uri)
    }
  }, [showFallback, title, categoryName, categorySlug, categoryColor, tools, mode])

  if (showFallback) {
    if (!svgUri) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          minHeight: '180px',
          background: categoryColor || '#0F6E56',
        }} />
      )
    }
    return (
      <img
        src={svgUri}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    )
  }

  return (
    <Image
      src={thumbnail!}
      alt={title}
      fill
      style={{ objectFit: 'cover' }}
      sizes="(max-width: 768px) 100vw, 400px"
      onError={() => setErrored(true)}
    />
  )
}
