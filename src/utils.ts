/**
 * Check if a string matches any of the provided regex patterns
 */
export const matchesAnyPattern = (str: string, patterns: RegExp[]): boolean => {
  return patterns.some((pattern) => pattern.test(str));
};

/**
 * Clean URL by removing query params and hash fragments
 */
export const cleanUrlPath = (url: string): string => {
  // Remove query params (everything after ?)
  let cleaned = url.split("?")[0];
  // Remove hash fragments (everything after #)
  cleaned = cleaned.replace(/#.*/, "");
  return cleaned;
};

/**
 * Trusted policy hooks for Trusted Types API
 */
export const trustedPolicyHooks: TrustedTypePolicyOptions = {
  createScript: (s) => s,
  createScriptURL: (s) => s,
};

/**
 * Create and configure a Trusted Types policy sanitizer
 */
export const createSanitizer = (trustedPolicyName: string) => {
  return (
    window.trustedTypes?.createPolicy(trustedPolicyName, trustedPolicyHooks) ??
    trustedPolicyHooks
  );
};

/**
 * Safely push commands to Matomo tracker with error handling
 * Some Matomo methods may not be available immediately after script load
 */
export const safePush = (
  pushFn: (args: any[]) => void,
  command: any[],
  debug = false,
): void => {
  try {
    pushFn(command);
  } catch (error) {
    if (debug) {
      console.warn(
        `Matomo: Method "${command[0]}" may not be available yet. Command queued.`,
        error,
      );
    }
    // Silently fail - command will be in queue for when method becomes available
  }
};
