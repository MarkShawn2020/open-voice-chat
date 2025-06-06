/**
 * Error Handler for Open Voice Chat API
 * 
 * Provides standardized error handling, logging, and response formatting
 * for API routes with security and debugging considerations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { envUtils } from './env-validation'
import { apiLogger } from './logger'

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'FORBIDDEN'

export interface ApiError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  stack?: string
  requestId?: string
}

export interface ApiErrorResponse {
  error: Omit<ApiError, 'stack'>
  timestamp: string
  path: string
  method: string
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly isOperational: boolean

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error creators
export const createError = {
  validation: (message: string, details?: Record<string, unknown>) =>
    new AppError('VALIDATION_ERROR', message, 400, details),
  
  authentication: (message: string = 'Authentication required') =>
    new AppError('AUTHENTICATION_ERROR', message, 401),
  
  authorization: (message: string = 'Insufficient permissions') =>
    new AppError('AUTHORIZATION_ERROR', message, 403),
  
  notFound: (resource: string = 'Resource') =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),
  
  rateLimit: (message: string = 'Rate limit exceeded') =>
    new AppError('RATE_LIMIT_EXCEEDED', message, 429),
  
  conflict: (message: string, details?: Record<string, unknown>) =>
    new AppError('CONFLICT', message, 409, details),
  
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new AppError('BAD_REQUEST', message, 400, details),
  
  forbidden: (message: string = 'Access forbidden') =>
    new AppError('FORBIDDEN', message, 403),
  
  internal: (message: string = 'Internal server error', details?: Record<string, unknown>) =>
    new AppError('INTERNAL_ERROR', message, 500, details, false),
  
  serviceUnavailable: (service: string) =>
    new AppError('SERVICE_UNAVAILABLE', `${service} is currently unavailable`, 503),
}

// Error type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

// Convert Zod validation errors to ApiError
export function handleZodError(error: ZodError): AppError {
  const details = error.errors.reduce((acc, err) => {
    const path = err.path.join('.')
    acc[path] = err.message
    return acc
  }, {} as Record<string, string>)

  return createError.validation(
    'Validation failed',
    { fields: details }
  )
}

// Format error for API response
export function formatErrorResponse(
  error: Error,
  request: NextRequest
): ApiErrorResponse {
  let apiError: ApiError

  if (isAppError(error)) {
    apiError = {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: envUtils.isDevelopment() ? error.stack : undefined,
    }
  } else if (isZodError(error)) {
    const handledError = handleZodError(error)
    apiError = {
      code: handledError.code,
      message: handledError.message,
      details: handledError.details,
      stack: envUtils.isDevelopment() ? error.stack : undefined,
    }
  } else {
    // Unknown error - don't expose details in production
    apiError = {
      code: 'INTERNAL_ERROR',
      message: envUtils.isDevelopment() ? error.message : 'Internal server error',
      stack: envUtils.isDevelopment() ? error.stack : undefined,
    }
  }

  return {
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method,
  }
}

// Get appropriate HTTP status code for error
export function getErrorStatusCode(error: Error): number {
  if (isAppError(error)) {
    return error.statusCode
  }
  
  if (isZodError(error)) {
    return 400
  }
  
  return 500
}

// Error handler wrapper for API routes
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Assume first argument is NextRequest for API routes
      const request = args[0] as NextRequest
      
      // Log the error
      apiLogger.error(
        'API route error',
        error instanceof Error ? error : new Error(String(error)),
        {
          path: request?.nextUrl?.pathname,
          method: request?.method,
          userAgent: request?.headers?.get('user-agent'),
        }
      )

      // Format and return error response
      const errorResponse = formatErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request
      )
      
      const statusCode = getErrorStatusCode(
        error instanceof Error ? error : new Error(String(error))
      )

      return NextResponse.json(errorResponse, { status: statusCode })
    }
  }
}

// Error boundary for API route handlers
export async function handleApiError(
  error: unknown,
  request: NextRequest
): Promise<NextResponse> {
  const normalizedError = error instanceof Error ? error : new Error(String(error))
  
  // Log the error with context
  apiLogger.error('Unhandled API error', normalizedError, {
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIp(request),
  })

  // Create error response
  const errorResponse = formatErrorResponse(normalizedError, request)
  const statusCode = getErrorStatusCode(normalizedError)

  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

// Security error handler - logs security events
export function handleSecurityError(
  error: AppError,
  request: NextRequest,
  additionalContext?: Record<string, unknown>
): NextResponse {
  // Log security event
  apiLogger.security(
    error.code,
    error.statusCode >= 500 ? 'high' : 'medium',
    {
      message: error.message,
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ip: getClientIp(request),
      ...additionalContext,
    }
  )

  // Return error response without sensitive details
  const errorResponse: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      // Don't include details for security errors in production
      details: envUtils.isDevelopment() ? error.details : undefined,
    },
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method,
  }

  return NextResponse.json(errorResponse, { status: error.statusCode })
}

// Utility to create consistent error responses
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  const errorResponse = {
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

// Get client IP for security logging
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (remoteAddr) {
    return remoteAddr
  }
  
  return 'unknown'
}

export default {
  AppError,
  createError,
  withErrorHandler,
  handleApiError,
  handleSecurityError,
  createErrorResponse,
  formatErrorResponse,
  getErrorStatusCode,
}
