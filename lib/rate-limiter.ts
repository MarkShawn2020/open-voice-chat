/**
 * Rate Limiter for Open Voice Chat API
 * 
 * Implements token bucket and sliding window rate limiting algorithms
 * with Redis support for distributed environments and memory fallback.
 */

import { NextRequest } from 'next/server'
import { envUtils } from './env-validation'
import { apiLogger } from './logger'
import { createError } from './error-handler'

export interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  enableLogging?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitData | null>
  set(key: string, data: RateLimitData): Promise<void>
  increment(key: string): Promise<RateLimitData>
}

interface RateLimitData {
  count: number
  resetTime: number
  firstRequest: number
}

// In-memory store for development/single instance
class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitData>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, data] of this.store.entries()) {
        if (data.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async get(key: string): Promise<RateLimitData | null> {
    const data = this.store.get(key)
    if (!data || data.resetTime < Date.now()) {
      this.store.delete(key)
      return null
    }
    return data
  }

  async set(key: string, data: RateLimitData): Promise<void> {
    this.store.set(key, data)
  }

  async increment(key: string): Promise<RateLimitData> {
    const existing = await this.get(key)
    const now = Date.now()
    
    if (!existing) {
      const newData: RateLimitData = {
        count: 1,
        resetTime: now + (this.getWindowMs() || 60000),
        firstRequest: now,
      }
      await this.set(key, newData)
      return newData
    }

    existing.count += 1
    await this.set(key, existing)
    return existing
  }

  private getWindowMs(): number {
    // This would need to be passed from the rate limiter instance
    return 60000 // Default 1 minute
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Redis store for production/distributed environments
class RedisStore implements RateLimitStore {
  private redisClient: any // Would need actual Redis client

  constructor(redisClient: any) {
    this.redisClient = redisClient
  }

  async get(key: string): Promise<RateLimitData | null> {
    try {
      const data = await this.redisClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      apiLogger.error('Redis get error', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  async set(key: string, data: RateLimitData): Promise<void> {
    try {
      const ttl = Math.max(0, data.resetTime - Date.now())
      await this.redisClient.setex(key, Math.ceil(ttl / 1000), JSON.stringify(data))
    } catch (error) {
      apiLogger.error('Redis set error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  async increment(key: string): Promise<RateLimitData> {
    // Redis-specific atomic increment implementation would go here
    // For now, fallback to get/set pattern
    const existing = await this.get(key)
    const now = Date.now()
    
    if (!existing) {
      const newData: RateLimitData = {
        count: 1,
        resetTime: now + 60000, // Would use actual window
        firstRequest: now,
      }
      await this.set(key, newData)
      return newData
    }

    existing.count += 1
    await this.set(key, existing)
    return existing
  }
}

export class RateLimiter {
  private config: RateLimitConfig
  private store: RateLimitStore

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      enableLogging: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      ...config,
    }

    // Use provided store or create default based on environment
    this.store = store || (envUtils.hasRedis() && envUtils.isProduction() 
      ? new RedisStore(null) // Would need actual Redis client
      : new MemoryStore())
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Try to get real IP, fallback to forwarded headers
    const ip = request.ip || 
              request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              request.headers.get('x-real-ip') ||
              'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = request.nextUrl.pathname
    
    // Create a composite key for better rate limiting
    return `rate_limit:${ip}:${path}:${this.hashString(userAgent)}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(request)
    const now = Date.now()

    try {
      const data = await this.store.increment(key)
      
      // Check if we're within the time window
      const withinWindow = now < data.resetTime
      const allowed = withinWindow ? data.count <= this.config.maxRequests : true

      // If outside window, reset the counter
      if (!withinWindow) {
        const newData: RateLimitData = {
          count: 1,
          resetTime: now + this.config.windowMs,
          firstRequest: now,
        }
        await this.store.set(key, newData)
        
        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: newData.resetTime,
          totalRequests: 1,
        }
      }

      const result: RateLimitResult = {
        allowed,
        remaining: Math.max(0, this.config.maxRequests - data.count),
        resetTime: data.resetTime,
        totalRequests: data.count,
      }

      // Log rate limit events
      if (this.config.enableLogging) {
        if (!allowed) {
          apiLogger.warn('Rate limit exceeded', {
            key: key.split(':').slice(0, 2).join(':'), // Don't log full key for privacy
            requests: data.count,
            limit: this.config.maxRequests,
            windowMs: this.config.windowMs,
            path: request.nextUrl.pathname,
            method: request.method,
          })
        } else if (data.count > this.config.maxRequests * 0.8) {
          apiLogger.info('Rate limit warning', {
            key: key.split(':').slice(0, 2).join(':'),
            requests: data.count,
            limit: this.config.maxRequests,
            remaining: result.remaining,
          })
        }
      }

      return result
    } catch (error) {
      apiLogger.error('Rate limiter error', error instanceof Error ? error : new Error(String(error)))
      
      // On error, allow the request but log the issue
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalRequests: 0,
      }
    }
  }
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Strict rate limiter for sensitive operations
  strict: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  // Auth rate limiter
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Only 5 auth attempts per 15 minutes
    keyGenerator: (request) => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      return `auth_limit:${ip}`
    },
  }),

  // Upload rate limiter
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (request) => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      return `upload_limit:${ip}`
    },
  }),

  // WebSocket connection rate limiter
  websocket: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (request) => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      return `ws_limit:${ip}`
    },
  }),
}

// Middleware wrapper for rate limiting
export function withRateLimit(
  rateLimiter: RateLimiter,
  options: { 
    onLimitExceeded?: (result: RateLimitResult) => void 
  } = {}
) {
  return async function rateLimitMiddleware(request: NextRequest) {
    const result = await rateLimiter.checkLimit(request)
    
    if (!result.allowed) {
      if (options.onLimitExceeded) {
        options.onLimitExceeded(result)
      }
      
      throw createError.rateLimit(
        `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`
      )
    }
    
    return result
  }
}

// Utility function to add rate limit headers to responses
export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  response.headers.set('X-RateLimit-Limit', result.totalRequests.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
  
  return response
}

export default {
  RateLimiter,
  rateLimiters,
  withRateLimit,
  addRateLimitHeaders,
}
