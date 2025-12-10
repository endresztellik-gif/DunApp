/**
 * Error Sanitization Utility
 *
 * Prevents information leakage through error messages by returning
 * only whitelisted safe error messages to clients.
 *
 * Security: Addresses CWE-209 (Information Exposure Through Error Message)
 * and CWE-497 (Exposure of System Data to an Unauthorized Control Sphere)
 */

/**
 * Whitelist of safe error message patterns that can be returned to clients
 * These messages do not expose internal system details
 */
const SAFE_ERROR_PATTERNS = [
  'Network error',
  'network error',
  'Request timeout',
  'request timeout',
  'timeout',
  'Invalid request',
  'invalid request',
  'Authentication failed',
  'authentication failed',
  'Unauthorized',
  'unauthorized',
  'Not found',
  'not found',
  'Bad request',
  'bad request',
  'Service unavailable',
  'service unavailable',
  'Too many requests',
  'too many requests',
] as const;

/**
 * Sanitize an error for safe client response
 *
 * This function ensures that only safe, generic error messages are returned
 * to clients, preventing exposure of internal system details, file paths,
 * database schemas, or other sensitive information.
 *
 * @param error - The error to sanitize (can be Error, string, or unknown)
 * @param defaultMessage - Optional custom default message (defaults to generic error)
 * @returns A safe error message string
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   console.error('Internal error:', error); // Log full error server-side
 *   return new Response(
 *     JSON.stringify({ error: sanitizeError(error) }), // Return safe message
 *     { status: 500 }
 *   );
 * }
 * ```
 */
export function sanitizeError(
  error: unknown,
  defaultMessage = 'An error occurred while processing your request'
): string {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check if error message matches any safe pattern
    for (const pattern of SAFE_ERROR_PATTERNS) {
      if (message.includes(pattern.toLowerCase())) {
        // Return the matched safe pattern (not the full error message)
        return pattern;
      }
    }

    // Error message doesn't match safe patterns - return default
    return defaultMessage;
  }

  // Handle string errors
  if (typeof error === 'string') {
    const message = error.toLowerCase();

    // Check if string matches any safe pattern
    for (const pattern of SAFE_ERROR_PATTERNS) {
      if (message.includes(pattern.toLowerCase())) {
        return pattern;
      }
    }

    return defaultMessage;
  }

  // Unknown error type - return safe default
  return defaultMessage;
}

/**
 * Create a sanitized error response for Supabase Edge Functions
 *
 * @param error - The error to sanitize
 * @param status - HTTP status code (defaults to 500)
 * @param headers - Optional additional headers
 * @returns Response object with sanitized error
 *
 * @example
 * ```typescript
 * try {
 *   await operation();
 * } catch (error) {
 *   console.error('Operation failed:', error);
 *   return createErrorResponse(error, 500);
 * }
 * ```
 */
export function createErrorResponse(
  error: unknown,
  status = 500,
  headers: HeadersInit = {}
): Response {
  const sanitizedError = sanitizeError(error);

  return new Response(
    JSON.stringify({
      error: sanitizedError,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Type guard to check if an error is a known safe error
 * Useful for conditional error handling
 *
 * @param error - The error to check
 * @returns true if error message matches a safe pattern
 */
export function isSafeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return SAFE_ERROR_PATTERNS.some(pattern =>
    message.includes(pattern.toLowerCase())
  );
}
