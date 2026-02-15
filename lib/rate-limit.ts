import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  })
}, 5 * 60 * 1000)

export function rateLimit(options: {
  windowMs: number
  maxRequests: number
}) {
  return function check(identifier: string): { success: boolean; remaining: number } {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now > entry.resetAt) {
      store.set(identifier, { count: 1, resetAt: now + options.windowMs })
      return { success: true, remaining: options.maxRequests - 1 }
    }

    if (entry.count >= options.maxRequests) {
      return { success: false, remaining: 0 }
    }

    entry.count++
    return { success: true, remaining: options.maxRequests - entry.count }
  }
}

// Pre-configured limiters
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
})

export const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
})

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Terlalu banyak request. Silakan coba lagi nanti.' },
    {
      status: 429,
      headers: { 'Retry-After': '900' },
    }
  )
}
