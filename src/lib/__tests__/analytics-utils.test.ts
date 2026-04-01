import { describe, it, expect } from 'vitest';
import {
  buildDateRange,
  buildChartData,
  aggregateTopCountries,
} from '../analytics-utils.js';

describe('buildDateRange', () => {
  it('returns the correct number of dates', () => {
    const result = buildDateRange(5);
    expect(result).toHaveLength(5);
  });

  it('returns dates in ascending order ending with today (UTC)', () => {
    const result = buildDateRange(3);
    const today = new Date();
    const todayKey = new Date(Date.UTC(
      today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()
    )).toISOString().slice(0, 10);
    expect(result[2]).toBe(todayKey);
  });

  it('returns YYYY-MM-DD formatted strings', () => {
    const result = buildDateRange(1);
    expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('buildChartData', () => {
  it('fills missing dates with 0', () => {
    const docs = { '2026-04-01': null, '2026-04-02': null };
    const result = buildChartData(docs, ['2026-04-01', '2026-04-02']);
    expect(result).toHaveLength(2);
    expect(result[0].views).toBe(0);
    expect(result[1].views).toBe(0);
  });

  it('uses the total from docs when present', () => {
    const docs = {
      '2026-04-01': { total: 42, posts: {}, countries: {} },
      '2026-04-02': null,
    };
    const result = buildChartData(docs, ['2026-04-01', '2026-04-02']);
    expect(result[0].views).toBe(42);
    expect(result[1].views).toBe(0);
  });

  it('formats dates as "Mon D" labels', () => {
    const docs = { '2026-04-01': null };
    const result = buildChartData(docs, ['2026-04-01']);
    // Apr 1 2026 is a Wednesday — label should be "Apr 1"
    expect(result[0].date).toBe('Apr 1');
  });
});

describe('aggregateTopCountries', () => {
  it('returns empty array for empty docs', () => {
    expect(aggregateTopCountries({}, 5)).toEqual([]);
  });

  it('sums country counts across multiple days', () => {
    const docs = {
      '2026-04-01': { total: 5, posts: {}, countries: { MY: 3, US: 2 } },
      '2026-04-02': { total: 4, posts: {}, countries: { MY: 1, SG: 3 } },
    };
    const result = aggregateTopCountries(docs, 5);
    const my = result.find((r) => r.code === 'MY')!;
    expect(my.views).toBe(4);
  });

  it('returns results sorted descending by views', () => {
    const docs = {
      'd': { total: 10, posts: {}, countries: { US: 1, MY: 9 } },
    };
    const result = aggregateTopCountries(docs, 5);
    expect(result[0].code).toBe('MY');
    expect(result[1].code).toBe('US');
  });

  it('respects the limit parameter', () => {
    const docs = {
      'd': { total: 6, posts: {}, countries: { A: 1, B: 2, C: 3, D: 4 } },
    };
    expect(aggregateTopCountries(docs, 2)).toHaveLength(2);
  });

  it('maps known country codes to names and flags', () => {
    const docs = { 'd': { total: 1, posts: {}, countries: { MY: 1 } } };
    const result = aggregateTopCountries(docs, 5);
    expect(result[0].name).toBe('Malaysia');
    expect(result[0].flag).toBe('🇲🇾');
  });

  it('uses raw code and globe flag for unknown country codes', () => {
    const docs = { 'd': { total: 1, posts: {}, countries: { ZZ: 1 } } };
    const result = aggregateTopCountries(docs, 5);
    expect(result[0].name).toBe('ZZ');
    expect(result[0].flag).toBe('🌐');
  });

  it('skips null docs without throwing', () => {
    const docs = { '2026-04-01': null, '2026-04-02': { total: 2, posts: {}, countries: { SG: 2 } } };
    const result = aggregateTopCountries(docs, 5);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('SG');
  });
});
