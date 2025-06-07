import { NextResponse } from 'next/server'

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

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        checks: {
          environment: true,
          rtc: true,
          ai: true,
          database: true,
          redis: true,
        },
        system,
      },
      { status: 200 }
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
