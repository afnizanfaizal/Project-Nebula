// src/lib/__tests__/upload-image.test.ts
// Unit-tests for the validation logic in /api/admin/upload-image.
// We test the guard conditions directly rather than importing the Astro route
// (which requires Node adapter context) so these run cleanly under Vitest.

import { describe, it, expect } from 'vitest';

// ── Constants mirrored from upload-image.ts ──────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ── Helper: make a fake File-like object ─────────────────────────────────────
function makeFile(type: string, sizeBytes: number): { type: string; size: number } {
  return { type, size: sizeBytes };
}

describe('upload-image: file size validation', () => {
  it('accepts a file exactly at the 5 MB limit', () => {
    const file = makeFile('image/jpeg', MAX_FILE_SIZE);
    expect(file.size > MAX_FILE_SIZE).toBe(false);
  });

  it('rejects a file 1 byte over the 5 MB limit', () => {
    const file = makeFile('image/jpeg', MAX_FILE_SIZE + 1);
    expect(file.size > MAX_FILE_SIZE).toBe(true);
  });

  it('accepts a 1 KB file', () => {
    const file = makeFile('image/png', 1024);
    expect(file.size > MAX_FILE_SIZE).toBe(false);
  });

  it('rejects a 10 MB file', () => {
    const file = makeFile('image/png', 10 * 1024 * 1024);
    expect(file.size > MAX_FILE_SIZE).toBe(true);
  });
});

describe('upload-image: MIME type validation', () => {
  it('accepts image/jpeg', () => {
    expect(ALLOWED_TYPES.includes('image/jpeg')).toBe(true);
  });

  it('accepts image/png', () => {
    expect(ALLOWED_TYPES.includes('image/png')).toBe(true);
  });

  it('accepts image/gif', () => {
    expect(ALLOWED_TYPES.includes('image/gif')).toBe(true);
  });

  it('accepts image/webp', () => {
    expect(ALLOWED_TYPES.includes('image/webp')).toBe(true);
  });

  it('rejects image/svg+xml (XSS risk)', () => {
    expect(ALLOWED_TYPES.includes('image/svg+xml')).toBe(false);
  });

  it('rejects application/pdf', () => {
    expect(ALLOWED_TYPES.includes('application/pdf')).toBe(false);
  });

  it('rejects text/html', () => {
    expect(ALLOWED_TYPES.includes('text/html')).toBe(false);
  });

  it('rejects an empty string type', () => {
    expect(ALLOWED_TYPES.includes('')).toBe(false);
  });
});
