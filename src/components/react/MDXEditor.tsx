// src/components/react/MDXEditor.tsx
// Only renders client-side (client:only="react")
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  frontmatterPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  InsertCodeBlock,
  CodeMirrorEditor,
} from '@mdxeditor/editor';
import { useState, useMemo } from 'react';

const today = new Date().toISOString().slice(0, 10);

const INITIAL_MARKDOWN = `---
title: "New Post"
pubDate: ${today}
description: ""
tags: []
featured: false
draft: true
---

Start writing here...
`;

// Override @mdxeditor/editor CSS custom properties for dark theme.
// These cascade down to all MDXEditor sub-components, replacing the
// light-theme defaults set on :root in @mdxeditor/editor/style.css.
const DARK_EDITOR_VARS = {
  '--baseBg': '#18181b',
  '--basePageBg': '#09090b',
  '--baseBgSubtle': '#27272a',
  '--baseBgHover': '#3f3f46',
  '--baseBgActive': '#52525b',
  '--baseLine': '#3f3f46',
  '--baseBorder': '#3f3f46',
  '--baseBorderStrong': '#71717a',
  '--baseSolid': '#71717a',
  '--baseSolidHover': '#a1a1aa',
  '--baseText': '#e4e4e7',
  '--baseTextContrast': '#fafafa',
  '--overlayBg': 'rgba(9,9,11,0.85)',
  '--accentBase': '#09090b',
  '--accentBgSubtle': '#27272a',
  '--accentBg': '#3f3f46',
  '--accentBgHover': '#52525b',
  '--accentBgActive': '#71717a',
  '--accentLine': '#71717a',
  '--accentBorder': '#52525b',
  '--accentBorderStrong': '#a1a1aa',
  '--accentSolid': '#a1a1aa',
  '--accentSolidHover': '#d4d4d8',
  '--accentText': '#d4d4d8',
  '--accentTextContrast': '#fafafa',
} as React.CSSProperties;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function BlogEditor() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [slug, setSlug] = useState('new-post');

  const words = useMemo(() => wordCount(markdown), [markdown]);
  const readingMins = Math.max(1, Math.ceil(words / 200));

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, slug }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div
      className="flex flex-col bg-zinc-950"
      style={{ minHeight: 'calc(100vh - 57px)', ...DARK_EDITOR_VARS }}
    >
      {/* ── Command bar ───────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 flex items-center gap-3 px-5 h-12 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
        {/* File path */}
        <span className="text-zinc-600 text-[11px] font-mono select-none">posts/</span>
        <input
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
          }
          className="w-44 bg-transparent text-zinc-300 text-[11px] font-mono outline-none
                     border-b border-transparent hover:border-zinc-700 focus:border-zinc-500
                     pb-px transition-colors placeholder:text-zinc-600"
          placeholder="post-slug"
          spellCheck={false}
        />
        <span className="text-zinc-600 text-[11px] font-mono select-none">.mdx</span>

        <div className="flex-1" />

        {/* Stats */}
        <span className="text-[11px] text-zinc-600 font-mono tabular-nums select-none">
          {words.toLocaleString()} w · {readingMins} min
        </span>

        {/* Status feedback */}
        {status === 'saved' && (
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Saved
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Failed
          </span>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          type="button"
          className="px-3.5 py-1 rounded bg-zinc-100 text-zinc-900 text-[11px] font-semibold
                     tracking-wide hover:bg-white active:bg-zinc-200
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save Post'}
        </button>
      </div>

      {/* ── Editor area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <MDXEditor
            markdown={markdown}
            onChange={setMarkdown}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              frontmatterPlugin(),
              codeBlockPlugin({
                defaultCodeBlockLanguage: 'ts',
                codeBlockEditorDescriptors: [
                  { match: () => true, priority: 100, Editor: CodeMirrorEditor },
                ],
              }),
              markdownShortcutPlugin(),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <InsertCodeBlock />
                  </>
                ),
              }),
            ]}
            contentEditableClassName="prose prose-invert prose-zinc max-w-none min-h-[65vh] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
