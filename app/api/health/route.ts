import { NextResponse } from 'next/server'
import { envUtils, validateEnvironment } from '@/lib/env-validation'
import { apiLogger } from '@/lib/logger'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    environment: boolean
    rtc: boolean
    ai: boolean
    database?: boolean
    redis?: boolean
  }
  system: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    platform: string
    nodeVersion: string
  }
  validation?: {
    errors: string[]
    warnings: string[]
  }
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    apiLogger.info('Health check requested')

    // Basic system information
    const system = {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      platform: process.platform,
      nodeVersion: process.version
    }

    // Environment validation
    const envValidation = validateEnvironment()
    
    // Service checks using environment utilities
    const checks = {
      environment: envValidation.isValid,
      rtc: !!(envUtils.getRTCConfig().appId && envUtils.getRTCConfig().appKey),
      ai: !!(envUtils.getAIConfig().doubao.apiKey),
      database: envUtils.hasDatabase(),
      redis: envUtils.hasRedis(),
    }

    // Determine overall health status
    const criticalChecks = [checks.environment, checks.rtc, checks.ai]
    const failedCritical = criticalChecks.filter(check => !check)
    const optionalChecks = [checks.database, checks.redis].filter(check => check !== undefined)
    const failedOptional = optionalChecks.filter(check => !check)
    
    let status: HealthStatus['status'] = 'healthy'
    if (failedCritical.length > 0) {
      status = 'unhealthy'
    } else if (failedOptional.length > 0 || envValidation.warnings.length > 0) {
      status = 'degraded'
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: envUtils.isDevelopment() ? 'development' : 
                   envUtils.isProduction() ? 'production' : 'test',
      uptime: process.uptime(),
      checks,
      system,
      validation: envValidation.errors.length > 0 || envValidation.warnings.length > 0 ? {
        errors: envValidation.errors,
        warnings: envValidation.warnings,
      } : undefined
    }

    const responseTime = Date.now() - startTime

    apiLogger.info('Health check completed', {
      status,
      responseTime: `${responseTime}ms`,
      checks,
    })

    return NextResponse.json(
      {
        ...healthStatus,
        responseTime: `${responseTime}ms`
      },
      { 
        status: status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    apiLogger.error('Health check failed', error instanceof Error ? error : new Error(errorMessage))

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        responseTime: `${responseTime}ms`
      },
      { status: 503 }
    )
  }
}
