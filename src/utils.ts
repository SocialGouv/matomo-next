/**
 * Check if a string matches any of the provided regex patterns
 */
export const matchesAnyPattern = (str: string, patterns: RegExp[]): boolean => {
  return patterns.some((pattern) => pattern.test(str));
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
