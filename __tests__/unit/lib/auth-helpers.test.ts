import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { createMockSession, createLimitedSession } from '../../mocks/session'

// Mock next-auth
const mockGetServerSession = vi.fn()
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}))

// Mock next/navigation - redirect throws like in real Next.js
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`)
})
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: { providers: [] },
}))

import {
  hasPermission,
  hasAnyPermission,
  requireAuth,
  requirePermission,
  requireApiPermission,
} from '@/lib/auth-helpers'

beforeEach(() => {
  vi.clearAllMocks()
})

// ============ Pure Functions ============

describe('hasPermission', () => {
  it('returns true when permission exists and is true', () => {
    expect(hasPermission({ 'items.view': true }, 'items.view')).toBe(true)
  })

  it('returns false when permission exists but is false', () => {
    expect(hasPermission({ 'items.view': false }, 'items.view')).toBe(false)
  })

  it('returns false when permission key does not exist', () => {
    expect(hasPermission({ 'items.view': true }, 'items.create')).toBe(false)
  })

  it('returns false when permissions object is undefined', () => {
    expect(hasPermission(undefined, 'items.view')).toBe(false)
  })

  it('returns false when permissions is an empty object', () => {
    expect(hasPermission({}, 'items.view')).toBe(false)
  })

  it('returns true for nested-style key like "users.view"', () => {
    expect(hasPermission({ 'users.view': true }, 'users.view')).toBe(true)
  })

  it('uses strict equality (=== true)', () => {
    // @ts-expect-error - testing runtime behavior with non-boolean value
    expect(hasPermission({ 'items.view': 1 }, 'items.view')).toBe(false)
    // @ts-expect-error
    expect(hasPermission({ 'items.view': 'yes' }, 'items.view')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('returns true when at least one permission matches', () => {
    const perms = { 'items.view': true, 'items.create': false }
    expect(hasAnyPermission(perms, ['items.view', 'items.create'])).toBe(true)
  })

  it('returns false when none match', () => {
    const perms = { 'items.view': false }
    expect(hasAnyPermission(perms, ['items.create', 'items.edit'])).toBe(false)
  })

  it('returns false when permissions is undefined', () => {
    expect(hasAnyPermission(undefined, ['items.view'])).toBe(false)
  })

  it('returns false when permissionList is empty array', () => {
    expect(hasAnyPermission({ 'items.view': true }, [])).toBe(false)
  })

  it('returns true when all permissions match', () => {
    const perms = { 'items.view': true, 'items.create': true }
    expect(hasAnyPermission(perms, ['items.view', 'items.create'])).toBe(true)
  })

  it('works with single-element array', () => {
    expect(hasAnyPermission({ 'items.view': true }, ['items.view'])).toBe(true)
    expect(hasAnyPermission({ 'items.view': true }, ['items.create'])).toBe(false)
  })
})

// ============ Server Functions ============

describe('requireAuth', () => {
  it('returns session when authenticated', async () => {
    const session = createMockSession()
    mockGetServerSession.mockResolvedValue(session)

    const result = await requireAuth()
    expect(result).toBe(session)
  })

  it('calls redirect("/login") when session is null', async () => {
    mockGetServerSession.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('does not call redirect when session exists', async () => {
    mockGetServerSession.mockResolvedValue(createMockSession())

    await requireAuth()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})

describe('requirePermission', () => {
  it('returns session when user has the permission', async () => {
    const session = createMockSession()
    mockGetServerSession.mockResolvedValue(session)

    const result = await requirePermission('items.view')
    expect(result).toBe(session)
  })

  it('redirects to /unauthorized when user lacks permission', async () => {
    const session = createLimitedSession(['items.view'])
    mockGetServerSession.mockResolvedValue(session)

    await expect(requirePermission('users.delete')).rejects.toThrow(
      'NEXT_REDIRECT:/unauthorized'
    )
  })

  it('redirects to /login when not authenticated at all', async () => {
    mockGetServerSession.mockResolvedValue(null)

    await expect(requirePermission('items.view')).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('works with Admin (all permissions)', async () => {
    const session = createMockSession() // Admin has all permissions
    mockGetServerSession.mockResolvedValue(session)

    const result = await requirePermission('roles.delete')
    expect(result).toBe(session)
  })

  it('denies Viewer for users.create', async () => {
    const session = createLimitedSession(['dashboard.view', 'items.view'])
    mockGetServerSession.mockResolvedValue(session)

    await expect(requirePermission('users.create')).rejects.toThrow(
      'NEXT_REDIRECT:/unauthorized'
    )
  })
})

describe('requireApiPermission', () => {
  it('returns {error: null, session} when authorized', async () => {
    const session = createMockSession()
    mockGetServerSession.mockResolvedValue(session)

    const result = await requireApiPermission('items.view')
    expect(result.error).toBeNull()
    expect(result.session).toBe(session)
  })

  it('returns 401 response when session is null', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await requireApiPermission('items.view')
    expect(result.error).toBeInstanceOf(NextResponse)
    expect(result.error!.status).toBe(401)
    expect(result.session).toBeNull()
  })

  it('401 response body contains "Unauthorized"', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await requireApiPermission('items.view')
    const body = await result.error!.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 403 response when permission denied', async () => {
    const session = createLimitedSession(['items.view'])
    mockGetServerSession.mockResolvedValue(session)

    const result = await requireApiPermission('users.delete')
    expect(result.error).toBeInstanceOf(NextResponse)
    expect(result.error!.status).toBe(403)
  })

  it('403 response body contains "Forbidden"', async () => {
    const session = createLimitedSession(['items.view'])
    mockGetServerSession.mockResolvedValue(session)

    const result = await requireApiPermission('users.delete')
    const body = await result.error!.json()
    expect(body.error).toBe('Forbidden')
  })

  it('session is null in error responses', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const r1 = await requireApiPermission('items.view')
    expect(r1.session).toBeNull()

    const session = createLimitedSession([])
    mockGetServerSession.mockResolvedValue(session)
    const r2 = await requireApiPermission('items.view')
    expect(r2.session).toBeNull()
  })

  it('works with specific permission like "items.view"', async () => {
    const session = createLimitedSession(['items.view'])
    mockGetServerSession.mockResolvedValue(session)

    const result = await requireApiPermission('items.view')
    expect(result.error).toBeNull()
    expect(result.session).toBe(session)
  })

  it('with empty permissions object returns 403', async () => {
    const session = createLimitedSession([])
    mockGetServerSession.mockResolvedValue(session)

    const result = await requireApiPermission('items.view')
    expect(result.error!.status).toBe(403)
  })

  it('with all-true permissions returns session for any key', async () => {
    const session = createMockSession()
    mockGetServerSession.mockResolvedValue(session)

    const r1 = await requireApiPermission('items.view')
    expect(r1.error).toBeNull()

    const r2 = await requireApiPermission('roles.delete')
    expect(r2.error).toBeNull()

    const r3 = await requireApiPermission('quotations.approve')
    expect(r3.error).toBeNull()
  })

  it('calls getServerSession with authOptions', async () => {
    mockGetServerSession.mockResolvedValue(createMockSession())

    await requireApiPermission('items.view')
    expect(mockGetServerSession).toHaveBeenCalledWith({ providers: [] })
  })
})
