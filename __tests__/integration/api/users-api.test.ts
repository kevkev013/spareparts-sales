import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createMockSession } from '../../mocks/session'

// Mock auth-helpers
const mockRequireApiPermission = vi.fn()
vi.mock('@/lib/auth-helpers', () => ({
  requireApiPermission: (...args: any[]) => mockRequireApiPermission(...args),
}))

// Mock user service
const mockGetUsers = vi.fn()
const mockCreateUser = vi.fn()
const mockGetUserById = vi.fn()
const mockUpdateUser = vi.fn()
const mockDeleteUser = vi.fn()

vi.mock('@/services/user.service', () => ({
  getUsers: (...args: any[]) => mockGetUsers(...args),
  createUser: (...args: any[]) => mockCreateUser(...args),
  getUserById: (...args: any[]) => mockGetUserById(...args),
  updateUser: (...args: any[]) => mockUpdateUser(...args),
  deleteUser: (...args: any[]) => mockDeleteUser(...args),
}))

import { GET, POST } from '@/app/api/users/route'
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/users/[id]/route'

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

function mockAuth(result: { error: NextResponse | null; session: any }) {
  mockRequireApiPermission.mockResolvedValue(result)
}

function mockUnauthorized() {
  mockAuth({
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    session: null,
  })
}

function mockForbidden() {
  mockAuth({
    error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    session: null,
  })
}

function mockAuthorized() {
  mockAuth({ error: null, session: createMockSession() })
}

// ============ GET /api/users ============

describe('GET /api/users', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthorized()

    const response = await GET(makeRequest('/api/users'))
    expect(response.status).toBe(401)
  })

  it('returns 403 when lacking users.view', async () => {
    mockForbidden()

    const response = await GET(makeRequest('/api/users'))
    expect(response.status).toBe(403)
  })

  it('returns 200 with user list when authorized', async () => {
    mockAuthorized()
    const mockData = { users: [{ id: '1' }], pagination: { total: 1 } }
    mockGetUsers.mockResolvedValue(mockData)

    const response = await GET(makeRequest('/api/users?page=1&limit=10'))
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.users).toHaveLength(1)
  })

  it('checks users.view permission', async () => {
    mockAuthorized()
    mockGetUsers.mockResolvedValue({ users: [], pagination: {} })

    await GET(makeRequest('/api/users'))
    expect(mockRequireApiPermission).toHaveBeenCalledWith('users.view')
  })
})

// ============ POST /api/users ============

describe('POST /api/users', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthorized()

    const response = await POST(
      makeRequest('/api/users', 'POST', { username: 'test' })
    )
    expect(response.status).toBe(401)
  })

  it('returns 403 when lacking users.create', async () => {
    mockForbidden()

    const response = await POST(
      makeRequest('/api/users', 'POST', { username: 'test' })
    )
    expect(response.status).toBe(403)
  })

  it('returns 201 when authorized and data valid', async () => {
    mockAuthorized()
    mockCreateUser.mockResolvedValue('new-id')

    const body = {
      username: 'newuser',
      password: 'pass123',
      fullName: 'New',
      roleId: 'r1',
    }
    const response = await POST(makeRequest('/api/users', 'POST', body))
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.id).toBe('new-id')
  })
})

// ============ GET /api/users/[id] ============

describe('GET /api/users/[id]', () => {
  it('returns user when found', async () => {
    mockAuthorized()
    mockGetUserById.mockResolvedValue({ id: '1', username: 'admin' })

    const response = await GET_BY_ID(makeRequest('/api/users/1'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(200)
  })

  it('returns 404 for non-existent user', async () => {
    mockAuthorized()
    mockGetUserById.mockResolvedValue(null)

    const response = await GET_BY_ID(makeRequest('/api/users/bad'), {
      params: { id: 'bad' },
    })
    expect(response.status).toBe(404)
  })
})

// ============ PUT /api/users/[id] ============

describe('PUT /api/users/[id]', () => {
  it('requires users.edit permission', async () => {
    mockForbidden()

    const response = await PUT(makeRequest('/api/users/1', 'PUT', { username: 'x' }), {
      params: { id: '1' },
    })
    expect(response.status).toBe(403)
    expect(mockRequireApiPermission).toHaveBeenCalledWith('users.edit')
  })

  it('returns success when authorized', async () => {
    mockAuthorized()
    mockUpdateUser.mockResolvedValue(undefined)

    const response = await PUT(
      makeRequest('/api/users/1', 'PUT', {
        username: 'updated',
        fullName: 'Updated',
        roleId: 'r1',
      }),
      { params: { id: '1' } }
    )
    expect(response.status).toBe(200)
  })
})

// ============ DELETE /api/users/[id] ============

describe('DELETE /api/users/[id]', () => {
  it('requires users.delete permission', async () => {
    mockForbidden()

    const response = await DELETE(makeRequest('/api/users/1', 'DELETE'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(403)
    expect(mockRequireApiPermission).toHaveBeenCalledWith('users.delete')
  })

  it('returns success when authorized', async () => {
    mockAuthorized()
    mockDeleteUser.mockResolvedValue(undefined)

    const response = await DELETE(makeRequest('/api/users/1', 'DELETE'), {
      params: { id: '1' },
    })
    expect(response.status).toBe(200)
  })
})
