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
import { useState } from 'react';

const INITIAL_MARKDOWN = `---
title: "New Post"
pubDate: ${new Date().toISOString().slice(0, 10)}
description: ""
tags: []
featured: false
draft: true
---

Start writing here...
`;

export default function BlogEditor() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
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
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="sticky top-14 z-40 flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">MDX Editor</h1>
        <div className="flex items-center gap-3">
          {status === 'saved' && <span className="text-xs text-green-600 dark:text-green-400">Saved!</span>}
          {status === 'error' && <span className="text-xs text-red-600 dark:text-red-400">Error saving</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <MDXEditor
          markdown={markdown}
          onChange={setMarkdown}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            frontmatterPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'ts', codeBlockEditorDescriptors: [{ match: () => true, priority: 100, Editor: CodeMirrorEditor }] }),
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
          contentEditableClassName="prose prose-zinc dark:prose-invert max-w-none min-h-[60vh] outline-none"
        />
      </div>
    </div>
  );
}
