// src/lib/__tests__/save-post.test.ts
// Unit-tests for the validation logic applied in /api/save-post.
// Guards are tested directly to avoid requiring the Astro Node adapter.

import { describe, it, expect } from 'vitest';

// ── Slug validation (mirrored from save-post.ts) ─────────────────────────────
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function isValidSlug(slug: string | undefined): boolean {
  if (!slug) return false;
  return SLUG_RE.test(slug);
}

describe('save-post: slug validation', () => {
  it('accepts a simple lowercase slug', () => {
    expect(isValidSlug('hello-world')).toBe(true);
  });

  it('accepts a slug starting with a digit', () => {
    expect(isValidSlug('2026-ai-trends')).toBe(true);
  });

  it('accepts a single character slug', () => {
    expect(isValidSlug('a')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidSlug(undefined)).toBe(false);
  });

  it('rejects a slug with uppercase letters', () => {
    expect(isValidSlug('Hello-World')).toBe(false);
  });

  it('rejects a slug starting with a hyphen', () => {
    expect(isValidSlug('-bad-slug')).toBe(false);
  });

  it('rejects a slug with spaces', () => {
    expect(isValidSlug('hello world')).toBe(false);
  });

  it('rejects a slug with special characters', () => {
    expect(isValidSlug('post/2026')).toBe(false);
  });

  it('rejects a slug with dots', () => {
    expect(isValidSlug('post.mdx')).toBe(false);
  });
});

// ── Title validation ──────────────────────────────────────────────────────────
function isValidTitle(title: unknown): boolean {
  return typeof title === 'string' && title.trim().length > 0;
}

describe('save-post: title validation', () => {
  it('accepts a non-empty string', () => {
    expect(isValidTitle('My Post')).toBe(true);
  });

  it('accepts a title with only leading/trailing spaces (trimmed)', () => {
    expect(isValidTitle('  My Post  ')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidTitle('')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect(isValidTitle('   ')).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidTitle(undefined)).toBe(false);
  });

  it('rejects a number', () => {
    expect(isValidTitle(42)).toBe(false);
  });
});

// ── Body validation ───────────────────────────────────────────────────────────
function isValidBody(body: unknown): boolean {
  return typeof body === 'string';
}

describe('save-post: body validation', () => {
  it('accepts an empty string body (allowed — writer may start blank)', () => {
    expect(isValidBody('')).toBe(true);
  });

  it('accepts markdown content', () => {
    expect(isValidBody('# Hello\n\nWorld')).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidBody(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidBody(undefined)).toBe(false);
  });

  it('rejects a number', () => {
    expect(isValidBody(123)).toBe(false);
  });
});
