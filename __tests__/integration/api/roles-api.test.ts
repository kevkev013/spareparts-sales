import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createMockSession } from '../../mocks/session'

// Mock auth-helpers
const mockRequireApiPermission = vi.fn()
vi.mock('@/lib/auth-helpers', () => ({
  requireApiPermission: (...args: any[]) => mockRequireApiPermission(...args),
}))

// Mock user service (role functions)
const mockGetRoles = vi.fn()
const mockCreateRole = vi.fn()
const mockGetRoleById = vi.fn()
const mockUpdateRole = vi.fn()
const mockDeleteRole = vi.fn()

vi.mock('@/services/user.service', () => ({
  getRoles: (...args: any[]) => mockGetRoles(...args),
  createRole: (...args: any[]) => mockCreateRole(...args),
  getRoleById: (...args: any[]) => mockGetRoleById(...args),
  updateRole: (...args: any[]) => mockUpdateRole(...args),
  deleteRole: (...args: any[]) => mockDeleteRole(...args),
}))

import { GET, POST } from '@/app/api/roles/route'
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/roles/[id]/route'

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(url: string, method = 'GET', body?: any): NextRequest {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}

function mockUnauthorized() {
  mockRequireApiPermission.mockResolvedValue({
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    session: null,
  })
}

function mockForbidden() {
  mockRequireApiPermission.mockResolvedValue({
    error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    session: null,
  })
}

function mockAuthorized() {
  mockRequireApiPermission.mockResolvedValue({
    error: null,
    session: createMockSession(),
  })
}

// ============ GET /api/roles ============

describe('GET /api/roles', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthorized()

    const response = await GET(makeRequest('/api/roles'))
    expect(response.status).toBe(401)
  })

  it('returns 403 when lacking roles.view', async () => {
    mockForbidden()

    const response = await GET(makeRequest('/api/roles'))
    expect(response.status).toBe(403)
    expect(mockRequireApiPermission).toHaveBeenCalledWith('roles.view')
  })

  it('returns 200 with roles list', async () => {
    mockAuthorized()
    const mockData = [{ id: '1', name: 'Admin' }, { id: '2', name: 'Sales' }]
    mockGetRoles.mockResolvedValue(mockData)

    const response = await GET(makeRequest('/api/roles'))
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toHaveLength(2)
  })
})

// ============ POST /api/roles ============

describe('POST /api/roles', () => {
  it('returns 403 when lacking roles.create', async () => {
    mockForbidden()

    const response = await POST(
      makeRequest('/api/roles', 'POST', { name: 'Test', permissions: {} })
    )
    expect(response.status).toBe(403)
    expect(mockRequireApiPermission).toHaveBeenCalledWith('roles.create')
  })

  it('returns 201 when authorized', async () => {
    mockAuthorized()
    mockCreateRole.mockResolvedValue('new-role-id')

    const response = await POST(
      makeRequest('/api/roles', 'POST', {
        name: 'Custom Role',
        permissions: { 'items.view': true },
      })
    )
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.id).toBe('new-role-id')
  })
})

// ============ GET /api/roles/[id] ============

describe('GET /api/roles/[id]', () => {
  it('returns 404 for non-existent role', async () => {
    mockAuthorized()
    mockGetRoleById.mockResolvedValue(null)

    const response = await GET_BY_ID(makeRequest('/api/roles/bad'), {
      params: { id: 'bad' },
    })
    expect(response.status).toBe(404)
  })

  it('returns role when found', async () => {
    mockAuthorized()
    mockGetRoleById.mockResolvedValue({ id: '1', name: 'Admin', permissions: {} })

    const response = await GET_BY_ID(makeRequest('/api/roles/1'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(200)
  })
})

// ============ PUT /api/roles/[id] ============

describe('PUT /api/roles/[id]', () => {
  it('requires roles.edit', async () => {
    mockForbidden()

    const response = await PUT(
      makeRequest('/api/roles/1', 'PUT', { name: 'X', permissions: {} }),
      { params: { id: '1' } }
    )
    expect(response.status).toBe(403)
    expect(mockRequireApiPermission).toHaveBeenCalledWith('roles.edit')
  })
})

// ============ DELETE /api/roles/[id] ============

describe('DELETE /api/roles/[id]', () => {
  it('requires roles.delete', async () => {
    mockForbidden()

    const response = await DELETE(makeRequest('/api/roles/1', 'DELETE'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(403)
    expect(mockRequireApiPermission).toHaveBeenCalledWith('roles.delete')
  })

  it('returns 500 with error for system role', async () => {
    mockAuthorized()
    mockDeleteRole.mockRejectedValue(new Error('Tidak dapat menghapus role sistem'))

    const response = await DELETE(makeRequest('/api/roles/1', 'DELETE'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe('Tidak dapat menghapus role sistem')
  })

  it('returns success when authorized and role deletable', async () => {
    mockAuthorized()
    mockDeleteRole.mockResolvedValue(undefined)

    const response = await DELETE(makeRequest('/api/roles/1', 'DELETE'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(200)
  })
})
