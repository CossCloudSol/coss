'use client'

import { useRef, useState } from 'react'

// Thin, PDF-only variant of ImagePicker's upload flow. ImagePicker's
// Browse/Paste tabs are image-specific (Cloudinary image browsing, image URL
// sniffing) and don't apply to a single per-course brochure PDF, so this
// skips them rather than bending that component to a second resource type.
interface BrochureUploadFieldProps {
  value: string
  onChange: (url: string) => void
}

export function BrochureUploadField({ value, onChange }: BrochureUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = (file: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    const form = new FormData()
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/media/brochure')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      let data: { secureUrl?: string; error?: string } = {}
      try { data = JSON.parse(xhr.responseText) } catch { /* non-JSON response */ }

      if (xhr.status >= 200 && xhr.status < 300 && data.secureUrl) {
        onChange(data.secureUrl)
      } else {
        setError(data.error ?? `Upload failed (HTTP ${xhr.status})`)
      }
    }
    xhr.onerror = () => {
      setUploading(false)
      setError('Network error during upload')
    }
    xhr.send(form)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />

      {value ? (
        <div className="flex items-center gap-3">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline truncate"
          >
            View current brochure
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-50 transition-colors"
        >
          {uploading ? `Uploading… ${progress}%` : 'Upload brochure PDF'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">PDF only. Max 4 MB.</p>
    </div>
  )
}
