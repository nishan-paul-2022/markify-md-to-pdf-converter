/**
 * Industry Standard Logger Utility
 * Provides a centralized way to handle application logs across environments.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

export const logger = {
  /**
   * Used for general information. Suppressed in production to keep the console clean.
   */
  info: (message: string, context?: unknown) => {
    if (!IS_PROD) {
      console.info(
        `%c[INFO] %c${message}`,
        'color: #3b82f6; font-weight: bold;',
        'color: inherit;',
        context ?? '',
      );
    }
  },

  /**
   * Used for potential issues that aren't breaking the app.
   */
  warn: (message: string, context?: unknown) => {
    console.warn(
      `%c[WARN] %c${message}`,
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;',
      context ?? '',
    );
  },

  /**
   * Used for critical errors. These should always be visible and
   * could be piped to error tracking services like Sentry.
   */
  error: (message: string, error?: unknown) => {
    console.error(
      `%c[ERROR] %c${message}`,
      'color: #ef4444; font-weight: bold;',
      'color: inherit;',
      error ?? '',
    );
    // FUTURE: Integrate Sentry.captureException(error) here
  },

  /**
   * Used for deep debugging. Never visible in production.
   */
  debug: (message: string, context?: unknown) => {
    if (!IS_PROD) {
      console.debug(
        `%c[DEBUG] %c${message}`,
        'color: #8b5cf6; font-weight: bold;',
        'color: inherit;',
        context ?? '',
      );
    }
  },
};
