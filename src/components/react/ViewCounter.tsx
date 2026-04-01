// src/components/react/ViewCounter.tsx
import { useEffect, useState } from 'react';

interface Props {
  slug: string;
}

export default function ViewCounter({ slug }: Props) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('track-view failed');
        return res.json() as Promise<{ views: number }>;
      })
      .then((data) => setViews(data.views))
      .catch(() => {
        // Silently fail — view counter is non-critical
      });
  }, [slug]);

  if (views === null) {
    return (
      <span
        className="inline-block w-12 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    <span className="text-sm text-zinc-500 dark:text-zinc-400">
      {views.toLocaleString()} views
    </span>
  );
}
