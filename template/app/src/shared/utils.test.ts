import { describe, it, expect } from 'vitest';
import { isAdminEmail } from './utils';

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
});
