/**
 * API Middleware Composer for Open Voice Chat
 * 
 * Provides a unified way to compose and apply middleware to API routes,
 * including error handling, rate limiting, CORS, logging, and security.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, handleApiError } from './error-handler'
import { withRateLimit, rateLimiters, addRateLimitHeaders, type RateLimiter } from './rate-limiter'
import { apiLogger } from './logger'
import { envUtils } from './env-validation'

export interface ApiMiddlewareConfig {
  cors?: CorsConfig
  rateLimit?: RateLimiter | keyof typeof rateLimiters
  requireAuth?: boolean
  logging?: boolean
  security?: SecurityConfig
}

export interface CorsConfig {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

export interface SecurityConfig {
  enableCSP?: boolean
  enableXSS?: boolean
  enableFrameOptions?: boolean
  enableContentType?: boolean
}

export type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse

// CORS middleware
function createCorsMiddleware(config: CorsConfig = {}) {
  const {
    origin = envUtils.isDevelopment() ? true : false,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = false,
    maxAge = 86400, // 24 hours
  } = config

  return function corsMiddleware(request: NextRequest, response: NextResponse): NextResponse {
    const requestOrigin = request.headers.get('origin')
    
    // Handle origin
    if (origin === true) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    } else if (typeof origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (Array.isArray(origin) && requestOrigin) {
      if (origin.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin)
      }
    } else if (typeof origin === 'boolean' && origin && requestOrigin) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin)
    }

    // Handle methods
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    
    // Handle headers
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    
    // Handle credentials
    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      response.headers.set('Access-Control-Max-Age', maxAge.toString())
    }

    return response
  }
}

// Security headers middleware
function createSecurityMiddleware(config: SecurityConfig = {}) {
  const {
    enableCSP = true,
    enableXSS = true,
    enableFrameOptions = true,
    enableContentType = true,
  } = config

  return function securityMiddleware(request: NextRequest, response: NextResponse): NextResponse {
    // Content Security Policy
    if (enableCSP) {
      const csp = envUtils.isDevelopment() 
        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' *" 
        : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      response.headers.set('Content-Security-Policy', csp)
    }

    // XSS Protection
    if (enableXSS) {
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('X-Content-Type-Options', 'nosniff')
    }

    // Frame Options
    if (enableFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY')
    }

    // Content Type
    if (enableContentType) {
      response.headers.set('X-Content-Type-Options', 'nosniff')
    }

    // Additional security headers
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    return response
  }
}

// Logging middleware
function createLoggingMiddleware() {
  return async function loggingMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    
    // Log request
    apiLogger.apiRequest(
      request.method,
      request.nextUrl.pathname,
      undefined,
      undefined
    )

    try {
      const response = await handler()
      const duration = Date.now() - startTime
      
      // Log successful response
      apiLogger.apiRequest(
        request.method,
        request.nextUrl.pathname,
        duration,
        response.status
      )

      // Add request ID to response
      response.headers.set('X-Request-ID', requestId)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Log error
      apiLogger.error(
        'API request failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          method: request.method,
          path: request.nextUrl.pathname,
          duration: `${duration}ms`,
          requestId,
        }
      )
      
      throw error
    }
  }
}

// Authentication middleware (placeholder)
function createAuthMiddleware() {
  return async function authMiddleware(request: NextRequest): Promise<void> {
    // This would implement actual authentication logic
    // For now, just check for Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentication required')
    }
    
    // Would validate token here
    apiLogger.debug('Authentication check passed', {
      path: request.nextUrl.pathname,
      hasAuth: !!authHeader,
    })
  }
}

// Main middleware composer
export function withApiMiddleware(config: ApiMiddlewareConfig = {}) {
  return function apiMiddleware(handler: ApiHandler) {
    return withErrorHandler(async (request: NextRequest, context?: any): Promise<NextResponse> => {
      let response: NextResponse

      // Create middleware instances
      const corsMiddleware = config.cors ? createCorsMiddleware(config.cors) : null
      const securityMiddleware = config.security ? createSecurityMiddleware(config.security) : null
      const loggingMiddleware = config.logging !== false ? createLoggingMiddleware() : null
      const authMiddleware = config.requireAuth ? createAuthMiddleware() : null

      // Handle OPTIONS requests for CORS
      if (request.method === 'OPTIONS' && corsMiddleware) {
        response = new NextResponse(null, { status: 200 })
        return corsMiddleware(request, response)
      }

      // Rate limiting
      let rateLimitResult
      if (config.rateLimit) {
        const limiter = typeof config.rateLimit === 'string' 
          ? rateLimiters[config.rateLimit]
          : config.rateLimit
        
        const rateLimitMiddleware = withRateLimit(limiter)
        rateLimitResult = await rateLimitMiddleware(request)
      }

      // Authentication
      if (authMiddleware) {
        await authMiddleware(request)
      }

      // Execute handler with logging
      if (loggingMiddleware) {
        response = await loggingMiddleware(request, () => handler(request, context))
      } else {
        response = await handler(request, context)
      }

      // Apply security headers
      if (securityMiddleware) {
        response = securityMiddleware(request, response)
      }

      // Apply CORS headers
      if (corsMiddleware) {
        response = corsMiddleware(request, response)
      }

      // Add rate limit headers
      if (rateLimitResult) {
        response = addRateLimitHeaders(response, rateLimitResult)
      }

      return response
    })
  }
}

// Convenience functions for common middleware combinations
export const apiMiddleware = {
  // Basic API middleware with CORS and logging
  basic: withApiMiddleware({
    cors: { origin: true },
    logging: true,
  }),

  // Secure API middleware with all protections
  secure: withApiMiddleware({
    cors: { origin: envUtils.isDevelopment() ? true : false },
    rateLimit: 'api',
    logging: true,
    security: {},
  }),

  // Authentication required middleware
  auth: withApiMiddleware({
    cors: { origin: true },
    rateLimit: 'auth',
    requireAuth: true,
    logging: true,
    security: {},
  }),

  // Strict middleware for sensitive operations
  strict: withApiMiddleware({
    cors: { origin: false },
    rateLimit: 'strict',
    requireAuth: true,
    logging: true,
    security: {
      enableCSP: true,
      enableXSS: true,
      enableFrameOptions: true,
      enableContentType: true,
    },
  }),

  // Upload middleware
  upload: withApiMiddleware({
    cors: { origin: true },
    rateLimit: 'upload',
    logging: true,
  }),

  // WebSocket upgrade middleware
  websocket: withApiMiddleware({
    cors: { origin: true },
    rateLimit: 'websocket',
    logging: true,
  }),
}

// Error handler specifically for API routes
export async function handleRouteError(error: unknown, request: NextRequest): Promise<NextResponse> {
  return handleApiError(error, request)
}

export default {
  withApiMiddleware,
  apiMiddleware,
  handleRouteError,
}
