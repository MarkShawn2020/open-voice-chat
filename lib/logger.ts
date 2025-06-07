/**
 * Logger Configuration for Open Voice Chat
 * 
 * Provides structured logging with different levels, contexts, and output formats.
 * Supports development and production environments with appropriate configurations.
 */
import { env } from "@/env.mjs";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, unknown>
  error?: Error
  userId?: string
  sessionId?: string
  requestId?: string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  format: 'json' | 'pretty'
  maxFileSize: number
  maxFiles: number
}

class Logger {
  private config: LoggerConfig
  private context?: string

  constructor(context?: string) {
    this.context = context
    this.config = this.getDefaultConfig()
  }

  private getDefaultConfig(): LoggerConfig {
    const isDevelopment = env.NODE_ENV === 'development'

    return {
      level: isDevelopment ? 'debug' : 'info',
      enableConsole: true,
      enableFile: !isDevelopment,
      enableRemote: env.NODE_ENV === 'production',
      format: isDevelopment ? 'pretty' : 'json',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    return levels[level] >= levels[this.config.level]
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry)
    }

    // Pretty format for development
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const level = entry.level.toUpperCase().padEnd(5)
    const context = entry.context ? `[${entry.context}]` : ''
    const message = entry.message
    const data = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : ''
    const error = entry.error ? `\n${entry.error.stack}` : ''

    return `${timestamp} ${level} ${context} ${message}${data}${error}`
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
      error,
      // These would be populated from request context in real implementation
      userId: undefined,
      sessionId: undefined,
      requestId: undefined,
    }
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedLog = this.formatLogEntry(entry)

    // Console output
    if (this.config.enableConsole) {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                          entry.level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](formattedLog)
    }

    // File output (would need file system implementation)
    if (this.config.enableFile) {
      // In a real implementation, this would write to a file
      // using fs or a logging library like winston
    }

    // Remote logging (would need remote service implementation)
    if (this.config.enableRemote) {
      // In a real implementation, this would send to a service
      // like Sentry, LogRocket, or custom logging endpoint
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('debug', message, data)
    this.writeLog(entry)
  }

  info(message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, data)
    this.writeLog(entry)
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('warn', message, data)
    this.writeLog(entry)
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('error', message, data, error)
    this.writeLog(entry)
  }

  // Utility methods for common logging patterns
  apiRequest(method: string, url: string, duration?: number, status?: number): void {
    this.info('API Request', {
      method,
      url,
      duration: duration ? `${duration}ms` : undefined,
      status,
    })
  }

  rtcEvent(event: string, roomId?: string, userId?: string, data?: Record<string, unknown>): void {
    this.info('RTC Event', {
      event,
      roomId,
      userId,
      ...data,
    })
  }

  aiInteraction(provider: string, model: string, duration?: number, tokens?: number): void {
    this.info('AI Interaction', {
      provider,
      model,
      duration: duration ? `${duration}ms` : undefined,
      tokens,
    })
  }

  userAction(action: string, userId?: string, data?: Record<string, unknown>): void {
    this.info('User Action', {
      action,
      userId,
      ...data,
    })
  }

  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.info('Performance Metric', {
      metric,
      value,
      unit,
    })
  }

  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: Record<string, unknown>): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
    const entry = this.createLogEntry(level, `Security Event: ${event}`, {
      severity,
      ...data,
    })
    this.writeLog(entry)
  }

  // Create a child logger with additional context
  child(additionalContext: string): Logger {
    const childContext = this.context ? `${this.context}:${additionalContext}` : additionalContext
    return new Logger(childContext)
  }
}

// Singleton logger instance
const rootLogger = new Logger()

// Named loggers for different parts of the application
export const logger = rootLogger
export const rtcLogger = rootLogger.child('RTC')
export const aiLogger = rootLogger.child('AI')
export const apiLogger = rootLogger.child('API')
export const authLogger = rootLogger.child('AUTH')
export const dbLogger = rootLogger.child('DB')

// Utility function to create context-specific loggers
export function createLogger(context: string): Logger {
  return rootLogger.child(context)
}

// Error boundary logging helper
export function logError(error: Error, context?: string, additionalData?: Record<string, unknown>): void {
  const contextLogger = context ? rootLogger.child(context) : rootLogger
  contextLogger.error(error.message, error, additionalData)
}

// Performance monitoring helper
export function withPerformanceLogging<T>(
  operation: string,
  fn: () => T | Promise<T>,
  logger: Logger = rootLogger
): T | Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result
        .then((value) => {
          logger.performance(operation, Date.now() - startTime)
          return value
        })
        .catch((error) => {
          logger.performance(operation, Date.now() - startTime)
          logger.error(`Operation failed: ${operation}`, error)
          throw error
        })
    } else {
      logger.performance(operation, Date.now() - startTime)
      return result
    }
  } catch (error) {
    logger.performance(operation, Date.now() - startTime)
    logger.error(`Operation failed: ${operation}`, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

export default logger
