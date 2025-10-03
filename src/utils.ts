/**
 * Check if a URL is excluded based on patterns
 */
export const isExcludedUrl = (url: string, patterns: RegExp[]): boolean => {
  return patterns.some((pattern) => pattern.test(url));
};

/**
 * Check if a string starts with a specific needle
 */
export const startsWith = (str: string, needle: string): boolean => {
  // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
  return str.substring(0, needle.length) === needle;
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
