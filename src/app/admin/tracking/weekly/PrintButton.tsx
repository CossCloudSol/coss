'use client'

import { Printer } from 'lucide-react'

export default function PrintButton(): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print
    </button>
  )
}
