// src/components/react/MDXEditor.tsx
// Only renders client-side (client:only="react")
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  type MDXEditorMethods,
  type JsxEditorProps,
  type MdastJsx,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  frontmatterPlugin,
  imagePlugin,
  jsxPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  InsertCodeBlock,
  CodeMirrorEditor,
  useMdastNodeUpdater,
  usePublisher,
  insertJsx$,
} from '@mdxeditor/editor';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// ── FigureEditor ────────────────────────────────────────────────────────────
// Rendered by MDXEditor inside the jsxPlugin whenever it encounters <Figure>.
// Shows a live preview with an alignment toolbar and optional caption input.

type Align = 'none' | 'left' | 'right' | 'center';

function getAttr(node: MdastJsx, name: string): string {
  const attr = (node.attributes ?? []).find(
    (a): a is { type: 'mdxJsxAttribute'; name: string; value: string } =>
      'name' in a && a.name === name,
  );
  return typeof attr?.value === 'string' ? attr.value : '';
}

function withAttr(node: MdastJsx, name: string, value: string): MdastJsx['attributes'] {
  const attrs = (node.attributes ?? []).filter(a => !('name' in a && a.name === name));
  return [...attrs, { type: 'mdxJsxAttribute', name, value }];
}

const ALIGN_BTNS: { value: Align; label: string }[] = [
  { value: 'none',   label: 'Block'  },
  { value: 'left',   label: 'Left'   },
  { value: 'center', label: 'Center' },
  { value: 'right',  label: 'Right'  },
];

function FigureEditor({ mdastNode }: JsxEditorProps) {
  const updateNode = useMdastNodeUpdater<MdastJsx>();
  const src     = getAttr(mdastNode, 'src');
  const alt     = getAttr(mdastNode, 'alt');
  const align   = (getAttr(mdastNode, 'align') || 'none') as Align;
  const caption = getAttr(mdastNode, 'caption');

  const set = (name: string, value: string) =>
    updateNode({ attributes: withAttr(mdastNode, name, value) });

  const previewStyle: React.CSSProperties = {
    none:   { display: 'block', maxWidth: '100%' },
    left:   { float: 'left',  maxWidth: '45%', marginRight: '1rem' },
    right:  { float: 'right', maxWidth: '45%', marginLeft:  '1rem' },
    center: { display: 'block', margin: '0 auto', maxWidth: '60%' },
  }[align];

  return (
    <div contentEditable={false} style={{ userSelect: 'none', marginBottom: '1rem' }}>
      <figure style={{ margin: 0, ...previewStyle }}>
        <img src={src} alt={alt} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
        {caption && (
          <figcaption style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Alignment + caption toolbar */}
      <div style={{
        display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap',
        marginTop: 6, padding: '4px 6px',
        background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6,
        clear: 'both',
      }}>
        <span style={{ fontSize: 11, color: '#71717a', marginRight: 2 }}>Align:</span>
        {ALIGN_BTNS.map(btn => (
          <button
            key={btn.value}
            type="button"
            onClick={() => set('align', btn.value)}
            style={{
              padding: '2px 8px', fontSize: 11, borderRadius: 4, border: 'none',
              cursor: 'pointer',
              background: align === btn.value ? '#3f3f46' : 'transparent',
              color:      align === btn.value ? '#fafafa'  : '#a1a1aa',
            }}
          >
            {btn.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <input
          placeholder="Add caption…"
          defaultValue={caption}
          onBlur={e => set('caption', e.target.value)}
          style={{
            background: 'transparent', border: '1px solid #3f3f46', color: '#e4e4e7',
            borderRadius: 4, padding: '2px 6px', fontSize: 11, width: 140,
          }}
        />
      </div>
    </div>
  );
}

// ── InsertJsxBridge ─────────────────────────────────────────────────────────
// Renders nothing visible. Lives inside the toolbar so it has access to
// MDXEditor's gurx context. Captures the insertJsx$ publisher into a ref so
// the command-bar upload button (outside MDXEditor) can call it.
type InsertJsxFn = (payload: { name: string; kind: 'flow' | 'text'; props: Record<string, string | boolean> }) => void;

function InsertJsxBridge({ bridgeRef }: { bridgeRef: React.MutableRefObject<InsertJsxFn | null> }) {
  const insertJsx = usePublisher(insertJsx$);
  bridgeRef.current = insertJsx;
  return null;
}

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

/** Remove image nodes with no src — artefacts from accidental toolbar clicks */
function stripBrokenImages(md: string): string {
  return md.replace(/!\[[^\]]*\]\(\s*\)\n?/g, '');
}

// Stable plugin list — defined outside the component so the array reference
// never changes between renders, preventing MDXEditor from re-initialising.
// Static plugins — no component-level refs needed.
const STATIC_PLUGINS = [
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
  imagePlugin(),
  jsxPlugin({
    jsxComponentDescriptors: [
      {
        name: 'Figure',
        kind: 'flow',
        // No `source` — Figure is passed via components prop in [slug].astro.
        props: [
          { name: 'src',     type: 'string' },
          { name: 'alt',     type: 'string' },
          { name: 'align',   type: 'string' },
          { name: 'caption', type: 'string' },
        ],
        hasChildren: false,
        Editor: FigureEditor,
      },
    ],
  }),
  markdownShortcutPlugin(),
];

interface Props {
  slug?: string;
}

export default function BlogEditor({ slug: initialSlug = '' }: Props) {
  const editorRef    = useRef<MDXEditorMethods>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Captures insertJsx$ publisher from inside MDXEditor's context (see InsertJsxBridge).
  const insertJsxRef = useRef<InsertJsxFn | null>(null);

  // Toolbar plugin is created per-instance because it closes over insertJsxRef.
  const plugins = useMemo(() => [
    ...STATIC_PLUGINS,
    toolbarPlugin({
      toolbarContents: () => (
        <>
          <InsertJsxBridge bridgeRef={insertJsxRef} />
          <UndoRedo />
          <BoldItalicUnderlineToggles />
          <BlockTypeSelect />
          <InsertCodeBlock />
        </>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const [editorKey, setEditorKey] = useState(0);
  // seedMarkdown initialises the editor (passed as `markdown` prop, read once on mount).
  // Never feed onChange output back into this — doing so would trigger MDXEditor's internal
  // corePlugin.update which re-subscribes onChange and can cause subtle reset races.
  const [seedMarkdown, setSeedMarkdown] = useState(() => stripBrokenImages(INITIAL_MARKDOWN));
  // latestMarkdown is updated synchronously via onChange; used for word-count and as the
  // source of truth for Save. A ref (not state) avoids any React async-state lag.
  const latestMarkdownRef = useRef(stripBrokenImages(INITIAL_MARKDOWN));
  const [markdown, setMarkdown] = useState(() => stripBrokenImages(INITIAL_MARKDOWN));
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [slug, setSlug] = useState(initialSlug || 'new-post');
  const [loading, setLoading] = useState(Boolean(initialSlug));

  const handleChange = useCallback((md: string) => {
    latestMarkdownRef.current = md;
    setMarkdown(md); // drives word-count display only
  }, []);

  // Load existing post content when a slug is provided
  useEffect(() => {
    if (!initialSlug) return;
    let cancelled = false;
    async function loadPost() {
      try {
        // cache: 'no-store' prevents the browser returning a stale cached response
        // when Astro's HMR reloads the page after a content-file write.
        const res = await fetch(
          `/api/admin/get-post?slug=${encodeURIComponent(initialSlug)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const data = await res.json() as { content: string; slug: string };
        if (!cancelled) {
          const clean = stripBrokenImages(data.content);
          latestMarkdownRef.current = clean;
          setSeedMarkdown(clean);
          setMarkdown(clean);
          setSlug(data.slug);
          setEditorKey(k => k + 1); // remount editor with loaded content
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPost();
    return () => { cancelled = true; };
  }, [initialSlug]);

  const words = useMemo(() => wordCount(markdown), [markdown]);
  const readingMins = Math.max(1, Math.ceil(words / 200));

  const handleSave = async () => {
    // getMarkdown() reads the live Lexical/gurx state directly and will include content
    // inserted via insertJsx$ (e.g. Figure nodes) that may not have fired onChange yet.
    // Fall back to the ref if the editor is unmounted.
    const fromEditor = editorRef.current?.getMarkdown();
    const latest = fromEditor || latestMarkdownRef.current;
    if (fromEditor) latestMarkdownRef.current = fromEditor; // keep ref in sync
    setSaving(true);
    setStatus('idle');
    setStatusMsg('');
    try {
      const res = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: latest, slug }),
      });
      if (res.ok) {
        // Update seedMarkdown so that if Astro HMR remounts the editor, it initialises
        // with the just-saved content instead of the originally-loaded content.
        setSeedMarkdown(latest);
        setStatus('saved');
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setStatusMsg(body.error ?? `HTTP ${res.status}`);
        setStatus('error');
      }
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleImageFile = async (file: File) => {
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');

      // Use insertJsx$ (via the bridge ref) — the correct MDXEditor API for
      // inserting JSX nodes. insertMarkdown() does not handle MDX JSX syntax.
      insertJsxRef.current?.({
        name: 'Figure',
        kind: 'flow',
        props: { src: data.url, alt: 'image', align: 'none' },
      });
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImgUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="w-5 h-5 border border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-zinc-950 h-screen"
      style={DARK_EDITOR_VARS as React.CSSProperties}
    >
      {/* ── Command bar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-5 h-12 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
        {/* Back to dashboard */}
        <a
          href="/admin/dashboard"
          className="flex items-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors mr-1"
          aria-label="Back to dashboard"
          title="Dashboard"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </a>

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
          <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium" title={statusMsg}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {statusMsg ? `Failed: ${statusMsg}` : 'Failed'}
          </span>
        )}

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = '';
          }}
        />

        {/* Insert image button */}
        <button
          type="button"
          title={imgUploading ? 'Uploading…' : 'Insert image'}
          disabled={imgUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center w-7 h-7 rounded text-zinc-400
                     hover:text-zinc-100 hover:bg-zinc-800 transition-colors
                     disabled:opacity-40 disabled:cursor-wait"
        >
          {imgUploading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.25 15.75 7.409 10.59a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          )}
        </button>

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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <MDXEditor
            key={editorKey}
            ref={editorRef}
            markdown={seedMarkdown}
            onChange={handleChange}
            plugins={plugins}
            contentEditableClassName="prose prose-invert prose-zinc max-w-none min-h-[65vh] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
