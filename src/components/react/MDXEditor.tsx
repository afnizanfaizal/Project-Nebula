// src/components/react/MDXEditor.tsx
// Only renders client-side (client:only="react")
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  codeBlockPlugin,
  imagePlugin,
  linkPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  InsertCodeBlock,
  CodeMirrorEditor,
} from '@mdxeditor/editor';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import MediaLibrary, { type ImageMetadata } from './MediaLibrary';

// ── Sidebar types ────────────────────────────────────────────────────────────
interface SidebarMeta {
  title:         string;
  description:   string;
  featuredImage: string;
  tags:          string[];
  status:        'draft' | 'published';
  featured:      boolean;
  isProject:     boolean;
  pubDate:       string; // YYYY-MM-DD
}

const todayISO = new Date().toISOString().slice(0, 10);

const EMPTY_META: SidebarMeta = {
  title:         '',
  description:   '',
  featuredImage: '',
  tags:          [],
  status:        'draft',
  featured:      false,
  isProject:     false,
  pubDate:       todayISO,
};

// ── Editor constants ─────────────────────────────────────────────────────────
const INITIAL_MARKDOWN = ``;

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

/** Remove broken standard markdown images with no src */
function stripBrokenImages(md: string): string {
  return md.replace(/!\[[^\]]*\]\(\s*\)\n?/g, '');
}

// Plugins are stable for the component's lifetime — defined in useMemo with
// no dependencies so MDXEditor never re-initialises during normal editing.
const PLUGINS_DEPS: [] = [];

interface Props {
  slug?: string;
}

export default function BlogEditor({ slug: initialSlug = '' }: Props) {
  const editorRef    = useRef<MDXEditorMethods>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plugins = useMemo(() => [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    codeBlockPlugin({
      defaultCodeBlockLanguage: 'ts',
      codeBlockEditorDescriptors: [
        { match: () => true, priority: 100, Editor: CodeMirrorEditor },
      ],
    }),
    imagePlugin(),
    linkPlugin(),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], PLUGINS_DEPS);

  const [seedMarkdown, setSeedMarkdown] = useState(() => stripBrokenImages(INITIAL_MARKDOWN));
  const latestMarkdownRef = useRef(stripBrokenImages(INITIAL_MARKDOWN));
  const [markdown, setMarkdown] = useState(() => stripBrokenImages(INITIAL_MARKDOWN));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState<string>('');
  const [slug, setSlug] = useState(initialSlug || '');
  const [loading, setLoading] = useState(Boolean(initialSlug));

  // Sidebar state
  const [meta, setMeta]               = useState<SidebarMeta>(EMPTY_META);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tagInput, setTagInput]       = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  // Toast for inline upload errors (replaces native alert())
  const [uploadError, setUploadError] = useState('');

  // Image alignment modal state
  const [pendingImgUrl, setPendingImgUrl]   = useState<string | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [showAlignModal, setShowAlignModal] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [showPDFLinkModal, setShowPDFLinkModal] = useState(false);
  const [pendingPDF, setPendingPDF] = useState<{ name: string; url: string } | null>(null);
  const [pdfLinkText, setPdfLinkText] = useState('');

  const showUploadError = useCallback((msg: string) => {
    setUploadError(msg);
    setTimeout(() => setUploadError(''), 4000);
  }, []);

  const handleChange = useCallback((md: string) => {
    latestMarkdownRef.current = md;
    setMarkdown(md);
  }, []);

  // Load existing post content when a slug is provided.
  useEffect(() => {
    if (!initialSlug) return;
    let cancelled = false;
    async function loadPost() {
      try {
        const res = await fetch(
          `/api/admin/get-post?slug=${encodeURIComponent(initialSlug)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const data = await res.json() as {
          meta: SidebarMeta & { slug: string };
          body: string;
        };
        if (!cancelled) {
          // Keep <Figure /> tags intact — blog renderer handles them.
          const clean = stripBrokenImages(data.body);
          latestMarkdownRef.current = clean;
          setMarkdown(clean);
          setSeedMarkdown(clean);
          setSlug(data.meta.slug);
          setMeta({
            title:         data.meta.title,
            description:   data.meta.description,
            featuredImage: data.meta.featuredImage,
            tags:          data.meta.tags,
            status:        data.meta.status,
            featured:      data.meta.featured ?? false,
            isProject:     data.meta.isProject ?? false,
            pubDate:       data.meta.pubDate,
          });
          // Editor is already mounted — call setMarkdown directly.
          editorRef.current?.setMarkdown(clean);
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

  const performSave = async (isAutosave = false) => {
    // Only autosave if we have a title and slug
    if (isAutosave && (!meta.title.trim() || !slug)) return false;

    const fromEditor = editorRef.current?.getMarkdown();
    const contentToSave = fromEditor || latestMarkdownRef.current;
    
    // Don't autosave if nothing changed
    if (isAutosave && contentToSave === seedMarkdown) return false;

    if (!isAutosave) {
      if (!meta.title.trim()) {
        setStatus('error');
        setStatusMsg('Title is required');
        setTimeout(() => setStatus('idle'), 3000);
        return false;
      }
      if (!slug) {
        setStatus('error');
        setStatusMsg('Slug is required');
        setTimeout(() => setStatus('idle'), 3000);
        return false;
      }
      setSaving(true);
    } else {
      setAutosaveStatus('Saving…');
    }

    try {
      const res = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { ...meta, slug }, body: contentToSave }),
      });

      if (res.ok) {
        setSeedMarkdown(contentToSave);
        if (isAutosave) {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAutosaveStatus(`Autosaved ${time}`);
        } else {
          setStatus('saved');
          // Direct user back to dashboard on manual save as requested
          setTimeout(() => {
            window.location.href = '/admin/dashboard?tab=posts';
          }, 800);
        }
        return true;
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const msg = body.error ?? `HTTP ${res.status}`;
        if (!isAutosave) {
          setStatusMsg(msg);
          setStatus('error');
        } else {
          setAutosaveStatus('Autosave failed');
        }
        return false;
      }
    } catch (err) {
      if (!isAutosave) {
        setStatusMsg(err instanceof Error ? err.message : String(err));
        setStatus('error');
      } else {
        setAutosaveStatus('Autosave error');
      }
      return false;
    } finally {
      if (!isAutosave) setSaving(false);
      // Status message on manual save stays for a bit or until redirect
    }
  };

  const handleSave = () => performSave(false);

  // Autosave effect: debounce 5 seconds
  useEffect(() => {
    if (!slug || !meta.title) return;
    
    const timer = setTimeout(() => {
      const fromEditor = editorRef.current?.getMarkdown();
      const current = fromEditor || latestMarkdownRef.current;
      if (current !== seedMarkdown) {
        performSave(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [markdown, meta, slug, seedMarkdown]);

  const handleTitleChange = (value: string) => {
    setMeta(m => ({ ...m, title: value }));
    if (!initialSlug) {
      const generated = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setSlug(generated || 'new-post');
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      setMeta(m => ({ ...m, featuredImage: data.url! }));
    } catch (err) {
      showUploadError(`Image upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImgUploading(false);
    }
  };

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !meta.tags.includes(tag)) {
      setMeta(m => ({ ...m, tags: [...m.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setMeta(m => ({ ...m, tags: m.tags.filter(t => t !== tag) }));
  };

  // Upload media and insert it into the editor.
  const handleImageFile = async (file: File) => {
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        setPendingPDF({ name: file.name, url: data.url });
        setPdfLinkText(file.name);
        setShowPDFLinkModal(true);
      } else {
        setPendingImgUrl(data.url);
        setShowAlignModal(true);
      }
    } catch (err) {
      showUploadError(`Media upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImgUploading(false);
    }
  };

  const handleSelectFromLibrary = (image: ImageMetadata) => {
    if (image.url.toLowerCase().endsWith('.pdf')) {
      setPendingPDF({ name: image.name, url: image.url });
      setPdfLinkText(image.name); // Default text is the filename
      setShowPDFLinkModal(true);
      setShowMediaBrowser(false);
    } else {
      setPendingImgUrl(image.url);
      setShowMediaBrowser(false);
      setShowAlignModal(true);
    }
  };

  const insertPDFLink = () => {
    if (!pendingPDF) return;
    
    const { url, name } = pendingPDF;
    const text = pdfLinkText.trim() || name;
    
    // Close modal first to remove focus trap
    setShowPDFLinkModal(false);
    
    setTimeout(() => {
      console.log(`[BlogEditor] Attempting to insert PDF link: [${text}](${url})`);
      // Focus MUST happen right before insertion in the timeout
      editorRef.current?.focus();
      editorRef.current?.insertMarkdown(` \n\n[${text}](${url})\n\n `);
      
      setPendingPDF(null);
      setPdfLinkText('');
    }, 300);
  };

  const insertAlignedImage = (align: 'none' | 'left' | 'right' | 'center') => {
    if (pendingImgUrl) {
      // Focus back to the editor before inserting markdown
      editorRef.current?.focus();
      // Use a timeout to ensure focus is established in Lexical before insertion
      const url = pendingImgUrl;
      setTimeout(() => {
        // Use a standard markdown image but with a URL fragment for the alignment.
        // This is the most stable and compatible path for the editor.
        // Adding newlines to ensure it's treated as a clean block.
        editorRef.current?.insertMarkdown(`\n\n![image](${url}#${align})\n\n`);
        setLastUploadedUrl(url);
        setPendingImgUrl(null);
      }, 200);
    }
    setShowAlignModal(false);
  };

  const handlePreview = () => {
    const fromEditor = editorRef.current?.getMarkdown();
    const content = fromEditor || latestMarkdownRef.current;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin/preview';
    form.target = '_blank';

    const fields = {
      title:         meta.title || 'Untitled Preview',
      content:       content,
      description:   meta.description,
      tags:          meta.tags.join(','),
      featuredImage: meta.featuredImage,
      pubDate:       meta.pubDate,
    };

    Object.entries(fields).forEach(([key, val]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(val || '');
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div
      className="flex flex-col bg-zinc-950 h-screen"
      style={DARK_EDITOR_VARS as React.CSSProperties}
    >
      {/* ── Command bar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-5 h-12 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
        {/* Back to dashboard */}
        <a
          href="/admin/dashboard?tab=posts"
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
        {autosaveStatus && !saving && status === 'idle' && (
          <span className="text-[10px] text-zinc-500 font-mono animate-in fade-in duration-500">
            {autosaveStatus}
          </span>
        )}

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

        {/* Hidden file input for body image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
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
          title={imgUploading ? 'Uploading…' : 'Upload media (Images & PDFs)'}
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

        {/* Browse Media button */}
        <button
          type="button"
          title="Browse Media Library"
          onClick={() => setShowMediaBrowser(true)}
          className="flex items-center justify-center w-7 h-7 rounded text-zinc-400
                     hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V9.776Z" />
          </svg>
        </button>

        {/* Upload error toast */}
        {uploadError && (
          <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium" title={uploadError}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {uploadError}
          </span>
        )}

        {/* Re-align last image button */}
        {lastUploadedUrl && (
          <button
            type="button"
            title="Re-align the last uploaded image"
            onClick={() => {
              setPendingImgUrl(lastUploadedUrl);
              setShowAlignModal(true);
            }}
            className="flex items-center justify-center h-8 px-3 rounded-md bg-zinc-800/80 border border-zinc-700
                       text-zinc-300 hover:text-white hover:bg-zinc-700 hover:border-zinc-500
                       transition-all text-[11px] font-medium"
          >
            <svg className="w-3.5 h-3.5 mr-1.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
            Re-align Last
          </button>
        )}

        {/* Sidebar toggle */}
        <button
          type="button"
          title={sidebarOpen ? 'Hide metadata' : 'Show metadata'}
          onClick={() => setSidebarOpen(o => !o)}
          className={`flex items-center justify-center w-7 h-7 rounded transition-colors
                      ${sidebarOpen
                        ? 'text-zinc-100 bg-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M15 3v18"/>
          </svg>
        </button>

        {/* Preview button */}
        <button
          type="button"
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 border border-zinc-700
                     text-zinc-300 text-[11px] font-semibold hover:text-white hover:bg-zinc-700
                     hover:border-zinc-600 transition-all active:scale-[0.98]"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Preview
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

      {/* ── Main area: editor + sidebar ─────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950">
            <div className="w-5 h-5 border border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        )}
        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          <MDXEditor
            ref={editorRef}
            markdown={seedMarkdown}
            onChange={handleChange}
            plugins={plugins}
            onError={(msg) => console.error('[MDXEditor Error]', msg)}
            contentEditableClassName="prose prose-invert max-w-none px-8 py-8 min-h-screen
                                       focus:outline-none text-zinc-200
                                       prose-headings:text-zinc-100 prose-code:text-zinc-200
                                       prose-a:text-blue-400"
          />
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
            <div className="p-5 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Title
                </label>
                <input
                  value={meta.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Post title"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-sm text-zinc-100 placeholder:text-zinc-600
                             focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                             transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={meta.description}
                  onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                  placeholder="Short summary for meta and previews"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-sm text-zinc-100 placeholder:text-zinc-600 resize-none
                             focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                             transition"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Featured Image
                </label>
                {meta.featuredImage && (
                  <div className="relative mb-2">
                    <img
                      src={meta.featuredImage}
                      alt="Featured"
                      className="w-full rounded-lg border border-zinc-700 object-cover"
                      style={{ maxHeight: 160, minHeight: 60, background: '#27272a' }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.minHeight = '60px';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setMeta(m => ({ ...m, featuredImage: '' }))}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-zinc-900/80
                                 text-zinc-400 hover:text-zinc-100 flex items-center justify-center text-xs"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg border
                                   border-dashed border-zinc-700 text-[11px] text-zinc-500
                                   hover:border-zinc-500 hover:text-zinc-400 cursor-pointer transition
                                   ${imgUploading ? 'opacity-50 cursor-wait' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={imgUploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFeaturedImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                  {imgUploading ? 'Uploading…' : (meta.featuredImage ? 'Replace image' : 'Upload image')}
                </label>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Tags
                </label>
                {meta.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {meta.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                                 bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-zinc-500 hover:text-zinc-300 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder="Add tag, press Enter"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-sm text-zinc-100 placeholder:text-zinc-600
                             focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                             transition"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                  {(['draft', 'published'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMeta(m => ({ ...m, status: s }))}
                      className={`flex-1 py-2 text-[11px] font-medium capitalize transition
                                  ${meta.status === s
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Featured
                </label>
                <button
                  type="button"
                  onClick={() => setMeta(m => ({ ...m, featured: !m.featured }))}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition
                              ${ meta.featured
                                ? 'bg-purple-950/40 border-purple-700/60 text-purple-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300' }`}
                >
                  <span className="text-[11px] font-medium">
                    {meta.featured ? 'Featured on homepage' : 'Not featured'}
                  </span>
                  <span className={`w-4 h-4 rounded-sm border flex items-center justify-center transition
                                    ${ meta.featured
                                      ? 'bg-purple-500 border-purple-400'
                                      : 'border-zinc-600' }`}>
                    {meta.featured && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              {/* Project Status */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Project Post
                </label>
                <button
                  type="button"
                  onClick={() => setMeta(m => ({ ...m, isProject: !m.isProject }))}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition
                              ${ meta.isProject
                                ? 'bg-blue-950/40 border-blue-700/60 text-blue-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300' }`}
                >
                  <span className="text-[11px] font-medium">
                    {meta.isProject ? 'Listed on Projects page' : 'Regular post'}
                  </span>
                  <span className={`w-4 h-4 rounded-sm border flex items-center justify-center transition
                                    ${ meta.isProject
                                      ? 'bg-blue-500 border-blue-400'
                                      : 'border-zinc-600' }`}>
                    {meta.isProject && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>


              {/* Pub Date */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={meta.pubDate}
                  onChange={e => setMeta(m => ({ ...m, pubDate: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-sm text-zinc-100
                             focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                             transition [color-scheme:dark]"
                />
              </div>

            </div>
          </aside>
        )}
      </div>

      {/* ── Image Alignment Modal ─────────────────────────────────────── */}
      {showAlignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">Text Wrap & Alignment</h3>
              <p className="text-zinc-500 text-xs mb-6">Choose how the image sits relative to your text.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'none',   label: 'Full Width', desc: 'No wrap', icon: 'M4 6h16M4 12h16M4 18h16' },
                  { id: 'left',   label: 'Left Wrap',  desc: 'Text on right', icon: 'M4 6h8M4 12h8M4 18h8M16 6h4v12h-4z' },
                  { id: 'right',  label: 'Right Wrap', desc: 'Text on left', icon: 'M12 6h8M12 12h8M12 18h8M4 6h4v12H4z' },
                  { id: 'center', label: 'Centered',   desc: 'Middle of page', icon: 'M8 6h8M8 12h8M8 18h8' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => insertAlignedImage(opt.id as any)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-800/50 
                               hover:bg-zinc-800 hover:border-zinc-700 hover:text-white transition group"
                  >
                    <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                    </svg>
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-zinc-200">{opt.label}</div>
                      <div className="text-[9px] text-zinc-500">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setShowAlignModal(false); setPendingImgUrl(null); }}
                className="w-full mt-6 py-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Browser Modal ───────────────────────────────────────── */}
      {showMediaBrowser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-zinc-100">Browse Media</h2>
              <button
                onClick={() => setShowMediaBrowser(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <MediaLibrary variant="picker" onSelect={handleSelectFromLibrary} />
            </div>
          </div>
        </div>
      )}
      {/* ── PDF Link Customization Modal ────────────────────────────────── */}
      {showPDFLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">Insert PDF Link</h3>
              <p className="text-zinc-500 text-xs mb-6">Type the text that readers will click on.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider">Link Text</label>
                  <input
                    autoFocus
                    value={pdfLinkText}
                    onChange={(e) => setPdfLinkText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        insertPDFLink();
                      }
                    }}
                    placeholder="Download PDF"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                               text-sm text-zinc-100 placeholder:text-zinc-600
                               focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setShowPDFLinkModal(false); setPendingPDF(null); }}
                  className="flex-1 py-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={insertPDFLink}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
