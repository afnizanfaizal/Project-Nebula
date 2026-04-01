// src/lib/analytics-utils.ts

export interface DailyData {
  total: number;
  posts: Record<string, number>;
  countries: Record<string, number>;
}

export interface ChartPoint {
  date: string;
  views: number;
}

export interface CountryEntry {
  code: string;
  name: string;
  flag: string;
  views: number;
}

const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
  MY: { name: 'Malaysia',       flag: '🇲🇾' },
  SG: { name: 'Singapore',      flag: '🇸🇬' },
  ID: { name: 'Indonesia',      flag: '🇮🇩' },
  US: { name: 'United States',  flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  AU: { name: 'Australia',      flag: '🇦🇺' },
  CA: { name: 'Canada',         flag: '🇨🇦' },
  DE: { name: 'Germany',        flag: '🇩🇪' },
  FR: { name: 'France',         flag: '🇫🇷' },
  JP: { name: 'Japan',          flag: '🇯🇵' },
  IN: { name: 'India',          flag: '🇮🇳' },
  BR: { name: 'Brazil',         flag: '🇧🇷' },
  NL: { name: 'Netherlands',    flag: '🇳🇱' },
  SE: { name: 'Sweden',         flag: '🇸🇪' },
  NO: { name: 'Norway',         flag: '🇳🇴' },
  PH: { name: 'Philippines',    flag: '🇵🇭' },
  TH: { name: 'Thailand',       flag: '🇹🇭' },
  VN: { name: 'Vietnam',        flag: '🇻🇳' },
  KR: { name: 'South Korea',    flag: '🇰🇷' },
  CN: { name: 'China',          flag: '🇨🇳' },
  RU: { name: 'Russia',         flag: '🇷🇺' },
  PK: { name: 'Pakistan',       flag: '🇵🇰' },
  BD: { name: 'Bangladesh',     flag: '🇧🇩' },
  NZ: { name: 'New Zealand',    flag: '🇳🇿' },
  ZA: { name: 'South Africa',   flag: '🇿🇦' },
  EG: { name: 'Egypt',          flag: '🇪🇬' },
  NG: { name: 'Nigeria',        flag: '🇳🇬' },
  IT: { name: 'Italy',          flag: '🇮🇹' },
  ES: { name: 'Spain',          flag: '🇪🇸' },
  PL: { name: 'Poland',         flag: '🇵🇱' },
};

/**
 * Returns an array of `days` date strings (YYYY-MM-DD, UTC) ending with today.
 */
export function buildDateRange(days: number): string[] {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = todayUTC - i * 86_400_000;
    result.push(new Date(ts).toISOString().slice(0, 10));
  }
  return result;
}

/**
 * Converts a map of date → DailyData into an ordered chart array.
 * Missing dates (null) produce a 0-view entry.
 */
export function buildChartData(
  docs: Record<string, DailyData | null>,
  dates: string[],
): ChartPoint[] {
  return dates.map((dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const label = new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { date: label, views: docs[dateKey]?.total ?? 0 };
  });
}

/**
 * Aggregates country view counts across all daily docs, sorts descending,
 * and returns up to `limit` entries with display names and flag emojis.
 */
export function aggregateTopCountries(
  docs: Record<string, DailyData | null>,
  limit: number,
): CountryEntry[] {
  const totals: Record<string, number> = {};
  for (const doc of Object.values(docs)) {
    if (!doc) continue;
    for (const [cc, count] of Object.entries(doc.countries)) {
      totals[cc] = (totals[cc] ?? 0) + count;
    }
  }
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([code, views]) => ({
      code,
      name: COUNTRY_INFO[code]?.name ?? code,
      flag: COUNTRY_INFO[code]?.flag ?? '🌐',
      views,
    }));
}
