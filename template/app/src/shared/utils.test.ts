import { describe, it, expect, vi } from 'vitest';
import { isAdminEmail, assertUnreachable, throttleWithTrailingInvocation, isValidEmail } from './utils';

describe('Shared Utilities', () => {
  describe('isAdminEmail', () => {
    it('should return true if email is in the admin list', () => {
      expect(isAdminEmail('admin@test.com', 'admin@test.com, user@test.com')).toBe(true);
    });

    it('should return false if email is not in the admin list', () => {
      expect(isAdminEmail('user@test.com', 'admin@test.com, another@test.com')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isAdminEmail('Admin@Test.com', 'admin@test.com')).toBe(true);
    });

    it('should handle whitespace around emails', () => {
      expect(isAdminEmail(' admin@test.com ', '  admin@test.com , user@test.com  ')).toBe(true);
    });

    it('should return false on empty inputs', () => {
      expect(isAdminEmail('', 'admin@test.com')).toBe(false);
      expect(isAdminEmail('admin@test.com', '')).toBe(false);
    });
  });

  describe('assertUnreachable', () => {
    it('should throw an error saying the code should be unreachable', () => {
      expect(() => assertUnreachable(null as any)).toThrowError('This code should be unreachable');
    });
  });

  describe('throttleWithTrailingInvocation', () => {
    it('should throttle function calls', () => {
      vi.useFakeTimers();
      let callCount = 0;
      const fn = () => { callCount++; };
      const throttled = throttleWithTrailingInvocation(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(callCount).toBe(1);

      vi.advanceTimersByTime(100);
      expect(callCount).toBe(2);

      throttled.cancel();
      vi.useRealTimers();
    });

    it('should execute immediately on next call if cancelled', () => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const throttled = throttleWithTrailingInvocation(fn, 100);

      throttled();
      expect(callCount).toBe(1);

      throttled.cancel();
      throttled();
      expect(callCount).toBe(2);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@sub.domain.co')).toBe(true);
    });

    it('should return false for invalid email formats', () => {
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@@missing-username.com')).toBe(false);
      expect(isValidEmail('username@.com')).toBe(false);
      expect(isValidEmail('username@missingtld')).toBe(false);
      expect(isValidEmail('username@server.c')).toBe(false);
    });

    it('should handle whitespaces', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });

    it('should return false on empty inputs', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });
});
