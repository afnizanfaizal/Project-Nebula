// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { getReadingTime, cn } from './utils';

describe('getReadingTime', () => {
  it('returns 1 for empty string', () => {
    expect(getReadingTime('')).toBe(1);
  });

  it('returns 1 for fewer than 200 words', () => {
    const text = 'word '.repeat(100);
    expect(getReadingTime(text)).toBe(1);
  });

  it('returns 1 for exactly 200 words', () => {
    const text = 'word '.repeat(200);
    expect(getReadingTime(text)).toBe(1);
  });

  it('returns 2 for 201-400 words', () => {
    const text = 'word '.repeat(250);
    expect(getReadingTime(text)).toBe(2);
  });

  it('returns 5 for 1000 words', () => {
    const text = 'word '.repeat(1000);
    expect(getReadingTime(text)).toBe(5);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves Tailwind conflicts — last class wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });
});
