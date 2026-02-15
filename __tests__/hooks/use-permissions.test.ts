// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockUseSession = vi.fn()
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

import { usePermissions } from '@/hooks/use-permissions'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('usePermissions', () => {
  it('isLoading is true when status is "loading"', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.isLoading).toBe(true)
  })

  it('isAuthenticated is true when status is "authenticated"', () => {
    mockUseSession.mockReturnValue({
      data: { user: { permissions: {} } },
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('isAuthenticated is false when status is "unauthenticated"', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('user is undefined when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.user).toBeUndefined()
  })

  it('user contains session data when authenticated', () => {
    const user = { id: '1', name: 'Test', permissions: { 'items.view': true } }
    mockUseSession.mockReturnValue({
      data: { user },
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.user).toEqual(user)
  })

  it('can() returns true for granted permission', () => {
    mockUseSession.mockReturnValue({
      data: { user: { permissions: { 'items.view': true, 'items.create': true } } },
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('items.view')).toBe(true)
  })

  it('can() returns false for denied permission', () => {
    mockUseSession.mockReturnValue({
      data: { user: { permissions: { 'items.view': true } } },
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('items.create')).toBe(false)
  })

  it('can() returns false when session is null', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('items.view')).toBe(false)
  })

  it('canAny() returns true when at least one matches', () => {
    mockUseSession.mockReturnValue({
      data: { user: { permissions: { 'items.view': true } } },
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.canAny(['items.view', 'items.create'])).toBe(true)
  })

  it('canAny() returns false when none match', () => {
    mockUseSession.mockReturnValue({
      data: { user: { permissions: { 'items.view': true } } },
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())
    expect(result.current.canAny(['items.create', 'items.delete'])).toBe(false)
  })
})
