'use client'

import { useState } from 'react'

interface Props {
  hasAdminEmail: boolean
}

export default function AdminLoginForm({ hasAdminEmail }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        // Full reload bypasses the Next.js router cache so AdminLayout
        // re-runs getServerSession() fresh and the sidebar renders with
        // the correct permissions on first visit.
        window.location.href = '/admin'
      } else {
        setError(data.message || data.error || 'Invalid credentials')
      }
    } catch {
      setError('Network error — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-teal-600">
          COSS Admin
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Sign in to manage your site
        </p>

        <form onSubmit={handleSubmit} method="post" className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="sr-only">
              Email address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              disabled={loading}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={loading}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
            {error ? (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        {hasAdminEmail ? (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            <p className="font-semibold">Admin login</p>
            <p className="mt-0.5">
              Enter your registered <strong>admin email</strong> and <strong>password</strong> to sign in.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <p className="font-semibold">Using env-var admin (no ADMIN_EMAIL set)?</p>
            <p className="mt-0.5">
              Leave the <strong>email field empty</strong> and enter only the{' '}
              <code className="rounded bg-amber-100 px-1">ADMIN_PASSWORD</code> from your{' '}
              <code className="rounded bg-amber-100 px-1">.env</code> file.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
