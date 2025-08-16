/**
 * Timing System Authentication Utilities
 * For use with hardware timing systems (Mac Mini + Arduino + Camera)
 * Uses service role key for long-lived, reliable authentication
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Creates an authenticated Supabase client using service role key
 * Perfect for hardware timing systems that need continuous operation
 */
export async function createTimingSupabaseClient(event: any) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Validates the timing system API key from request headers
 */
export async function validateTimingAuth(event: any): Promise<boolean> {
  try {
    // Get the Authorization header
    const authHeader = getHeader(event, 'authorization') || getHeader(event, 'Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }
    
    const providedKey = authHeader.substring(7) // Remove 'Bearer ' prefix
    const expectedKey = process.env.TIMING_SYSTEM_API_KEY
    
    if (!expectedKey) {
      console.error('TIMING_SYSTEM_API_KEY environment variable not set')
      return false
    }
    
    return providedKey === expectedKey
    
  } catch (error) {
    console.error('Timing system auth validation error:', error instanceof Error ? error.message : String(error))
    return false
  }
}

/**
 * Middleware to protect timing endpoints with API key authentication
 */
export async function requireTimingAuth(event: any) {
  const isValid = await validateTimingAuth(event)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or missing timing system API key'
    })
  }
}

/**
 * Logs timing system requests for audit purposes
 */
export function logTimingRequest(event: any, action: string, data?: any) {
  const timestamp = new Date().toISOString()
  const ip = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'Unknown'
  
  console.log(`[TIMING] ${timestamp} - ${action}`, {
    ip,
    userAgent,
    data
  })
}