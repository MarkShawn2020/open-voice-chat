/**
 * Environment Variable Validation
 * 
 * This module validates and provides type-safe access to environment variables.
 * It ensures all required environment variables are present and correctly formatted.
 */

import { z } from 'zod'

// Define environment variable schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  
  // VolcEngine RTC - Required in production, optional in development
  VOLCENGINE_APP_ID: z.string().optional(),
  VOLCENGINE_APP_KEY: z.string().optional(),
  VOLCENGINE_SECRET_KEY: z.string().optional(),
  
  // ByteDance Doubao AI - Required in production, optional in development
  DOUBAO_API_KEY: z.string().optional(),
  DOUBAO_BASE_URL: z.string().url().optional(),
  DOUBAO_MODEL: z.string().default('doubao-pro-4k'),
  
  // Optional: OpenAI (fallback)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  
  // Optional: Anthropic (fallback)
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Optional: Database
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  
  // Optional: Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
  
  // Optional: Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  
  // Optional: Authentication
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Optional: External APIs
  WEBHOOK_SECRET: z.string().optional(),
})

// Define the type for validated environment variables
export type Env = z.infer<typeof envSchema>

// Validation function
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  
  return parsed.data
}

// Validated environment variables (singleton)
let env: Env | null = null

export function getEnv(): Env {
  if (!env) {
    env = validateEnv()
  }
  return env
}

// Utility functions for common checks
export const envUtils = {
  isDevelopment: () => getEnv().NODE_ENV === 'development',
  isProduction: () => getEnv().NODE_ENV === 'production',
  isTest: () => getEnv().NODE_ENV === 'test',
  
  hasDatabase: () => !!getEnv().DATABASE_URL,
  hasRedis: () => !!getEnv().REDIS_URL,
  hasAnalytics: () => !!getEnv().NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  hasMonitoring: () => !!getEnv().SENTRY_DSN,
  hasAuth: () => !!getEnv().NEXTAUTH_SECRET,
  
  // RTC Configuration
  getRTCConfig: () => ({
    appId: getEnv().VOLCENGINE_APP_ID,
    appKey: getEnv().VOLCENGINE_APP_KEY,
    secretKey: getEnv().VOLCENGINE_SECRET_KEY,
  }),
  
  // AI Configuration
  getAIConfig: () => ({
    doubao: {
      apiKey: getEnv().DOUBAO_API_KEY,
      baseUrl: getEnv().DOUBAO_BASE_URL,
      model: getEnv().DOUBAO_MODEL,
    },
    openai: {
      apiKey: getEnv().OPENAI_API_KEY,
      baseUrl: getEnv().OPENAI_BASE_URL,
    },
    anthropic: {
      apiKey: getEnv().ANTHROPIC_API_KEY,
    },
  }),
}

// Environment validation status
export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiredMissing: string[]
  optionalMissing: string[]
}

export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    requiredMissing: [],
    optionalMissing: [],
  }
  
  try {
    const parsed = envSchema.safeParse(process.env)
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      
      // Categorize errors
      Object.entries(fieldErrors).forEach(([field, errors]) => {
        const errorMessages = errors || []
        
        // Check if it's a required field in production
        const isRequiredInProduction = ['VOLCENGINE_APP_ID', 'VOLCENGINE_APP_KEY', 'DOUBAO_API_KEY'].includes(field)
        
        if (isRequiredInProduction && isProduction) {
          result.requiredMissing.push(field)
          result.errors.push(...errorMessages.map(err => `${field}: ${err}`))
          result.isValid = false
        } else if (isRequiredInProduction && !isProduction) {
          // In development, treat as warnings
          result.warnings.push(`${field} is not set (required for production)`)
        } else {
          result.optionalMissing.push(field)
          result.warnings.push(...errorMessages.map(err => `${field}: ${err}`))
        }
      })
    }
    
    // Additional validation warnings
    const env = parsed.success ? parsed.data : process.env
    
    if (!env.NEXT_PUBLIC_APP_URL && env.NODE_ENV === 'production') {
      result.warnings.push('NEXT_PUBLIC_APP_URL should be set in production')
    }
    
    if (!env.NEXTAUTH_SECRET && env.NODE_ENV === 'production') {
      result.warnings.push('NEXTAUTH_SECRET should be set in production for security')
    }
    
    if (!env.SENTRY_DSN && env.NODE_ENV === 'production') {
      result.warnings.push('SENTRY_DSN recommended for production error monitoring')
    }
    
  } catch (error) {
    result.isValid = false
    result.errors.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return result
}

// Initialize environment validation on module load
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    const validation = validateEnvironment()
    
    if (validation.isValid) {
      console.log('✅ Environment variables validated successfully')
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Environment warnings:', validation.warnings)
      }
    } else {
      console.error('❌ Environment validation failed:', validation.errors)
      
      // Only exit in production if there are critical errors
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      } else {
        console.warn('⚠️ Continuing in development mode with missing environment variables')
        console.warn('⚠️ Some features may not work correctly without proper configuration')
      }
    }
  } catch (error) {
    console.error('❌ Environment validation error:', error)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}
