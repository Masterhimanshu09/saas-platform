/**
 * Used purely to help compiler check for exhaustiveness in switch statements,
 * will never execute. See https://stackoverflow.com/a/39419171.
 */
export function assertUnreachable(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: never,
): never {
  throw Error("This code should be unreachable");
}

/**
 * Allows for throttling a function call while still allowing the last invocation to be executed after the throttle delay ends.
 */
export function throttleWithTrailingInvocation(
  fn: () => void,
  delayInMilliseconds: number,
): (() => void) & { cancel: () => void } {
  let fnLastCallTime: number | null = null;
  let trailingInvocationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let isTrailingInvocationPending = false;

  const callFn = () => {
    fnLastCallTime = Date.now();
    fn();
  };

  const throttledFn = () => {
    const currentTime = Date.now();
    const timeSinceLastExecution = fnLastCallTime
      ? currentTime - fnLastCallTime
      : 0;

    const shouldCallImmediately =
      fnLastCallTime === null || timeSinceLastExecution >= delayInMilliseconds;

    if (shouldCallImmediately) {
      callFn();
      return;
    }

    if (!isTrailingInvocationPending) {
      isTrailingInvocationPending = true;
      const remainingDelayTime = Math.max(
        delayInMilliseconds - timeSinceLastExecution,
        0,
      );

      trailingInvocationTimeoutId = setTimeout(() => {
        callFn();
        isTrailingInvocationPending = false;
      }, remainingDelayTime);
    }
  };

  throttledFn.cancel = () => {
    if (trailingInvocationTimeoutId) {
      clearTimeout(trailingInvocationTimeoutId);
      trailingInvocationTimeoutId = null;
    }
    isTrailingInvocationPending = false;
    fnLastCallTime = null;
  };

  return throttledFn as typeof throttledFn & { cancel: () => void };
}

/**
 * Checks if an email address is listed in the admin emails string.
 */
export function isAdminEmail(email: string, adminEmailsStr: string): boolean {
  if (!email || !adminEmailsStr) return false;
  const adminEmails = adminEmailsStr.split(',').map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.trim().toLowerCase());
}

/**
 * Validates whether an email matches a basic standard email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}


