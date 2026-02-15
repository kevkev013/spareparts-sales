// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const mockCan = vi.fn()
vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    can: (permission: string) => mockCan(permission),
  }),
}))

import { PermissionGate } from '@/components/permission-gate'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PermissionGate', () => {
  it('renders children when permission is granted', () => {
    mockCan.mockReturnValue(true)

    render(
      <PermissionGate permission="items.view">
        <span data-testid="child">Visible</span>
      </PermissionGate>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders null when permission is denied', () => {
    mockCan.mockReturnValue(false)

    const { container } = render(
      <PermissionGate permission="items.create">
        <span data-testid="child">Hidden</span>
      </PermissionGate>
    )

    expect(container.innerHTML).toBe('')
  })

  it('calls can() with the correct permission string', () => {
    mockCan.mockReturnValue(true)

    render(
      <PermissionGate permission="users.delete">
        <span>Content</span>
      </PermissionGate>
    )

    expect(mockCan).toHaveBeenCalledWith('users.delete')
  })

  it('renders null for viewer checking "users.create"', () => {
    mockCan.mockImplementation((p: string) => p.endsWith('.view'))

    const { container } = render(
      <PermissionGate permission="users.create">
        <span>Create User</span>
      </PermissionGate>
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders for viewer checking "items.view"', () => {
    mockCan.mockImplementation((p: string) => p.endsWith('.view'))

    render(
      <PermissionGate permission="items.view">
        <span data-testid="visible">Items</span>
      </PermissionGate>
    )

    expect(screen.getByTestId('visible')).toBeInTheDocument()
  })

  it('handles multiple nested children correctly', () => {
    mockCan.mockReturnValue(true)

    render(
      <PermissionGate permission="items.view">
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </PermissionGate>
    )

    expect(screen.getByTestId('first')).toBeInTheDocument()
    expect(screen.getByTestId('second')).toBeInTheDocument()
  })
})
