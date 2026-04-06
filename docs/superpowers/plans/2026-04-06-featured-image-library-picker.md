# Featured Image — Media Library Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to pick an existing image from the Media Library as the post's featured image, alongside the existing upload option.

**Architecture:** All changes are confined to `src/components/react/MDXEditor.tsx`. A new `showFeaturedImagePicker` boolean state controls a dedicated modal that wraps `MediaLibrary` in `variant="picker"` mode. A new `handleSelectFeaturedImage` handler sets `meta.featuredImage` and closes the modal. The Featured Image sidebar section gets a second button ("Choose from library") beneath the existing upload label.

**Tech Stack:** React, TypeScript, Tailwind CSS. `MediaLibrary` component (`src/components/react/MediaLibrary.tsx`) already supports `variant="picker"` and `onSelect` — no changes needed there.

---

### Task 1: Add `showFeaturedImagePicker` state

**Files:**
- Modify: `src/components/react/MDXEditor.tsx:151`

The new state goes directly after the existing `showMediaBrowser` state declaration (line 151).

- [ ] **Step 1: Add the state**

In `src/components/react/MDXEditor.tsx`, find this block (around line 151):

```tsx
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
```

Add the new state on the next line:

```tsx
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [showFeaturedImagePicker, setShowFeaturedImagePicker] = useState(false);
```

- [ ] **Step 2: Verify the file still compiles**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 3: Commit**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog"
git add src/components/react/MDXEditor.tsx
git commit -m "feat: add showFeaturedImagePicker state to MDXEditor"
```

---

### Task 2: Add `handleSelectFeaturedImage` handler

**Files:**
- Modify: `src/components/react/MDXEditor.tsx` (after `handleSelectFromLibrary`, ~line 388)

- [ ] **Step 1: Add the handler**

In `src/components/react/MDXEditor.tsx`, find the end of `handleSelectFromLibrary` (around line 388):

```tsx
  const handleSelectFromLibrary = (image: ImageMetadata) => {
    if (image.url.toLowerCase().endsWith('.pdf')) {
      setPendingPDF({ name: image.name, url: image.url });
      setPdfLinkText(image.name);
      setShowPDFLinkModal(true);
      setShowMediaBrowser(false);
    } else {
      setPendingImgUrl(image.url);
      setShowMediaBrowser(false);
      setShowAlignModal(true);
    }
  };
```

Add the new handler immediately after it:

```tsx
  const handleSelectFeaturedImage = (image: ImageMetadata) => {
    // PDFs are not valid featured images — ignore silently
    if (image.url.toLowerCase().endsWith('.pdf')) return;
    setMeta(m => ({ ...m, featuredImage: image.url }));
    setShowFeaturedImagePicker(false);
  };
```

- [ ] **Step 2: Verify the file still compiles**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 3: Commit**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog"
git add src/components/react/MDXEditor.tsx
git commit -m "feat: add handleSelectFeaturedImage handler"
```

---

### Task 3: Update Featured Image sidebar UI

**Files:**
- Modify: `src/components/react/MDXEditor.tsx:860-876`

Replace the single upload `<label>` with two stacked buttons: the existing upload label and a new "Choose from library" button.

- [ ] **Step 1: Replace the upload label**

In `src/components/react/MDXEditor.tsx`, find and replace the existing upload label in the Featured Image section (lines ~860–876):

**Old code:**
```tsx
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
```

**New code:**
```tsx
                <div className="flex flex-col gap-1.5">
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
                  <button
                    type="button"
                    onClick={() => setShowFeaturedImagePicker(true)}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border
                               border-zinc-700 text-[11px] text-zinc-500
                               hover:border-zinc-500 hover:text-zinc-400 transition"
                  >
                    {meta.featuredImage ? 'Choose different image' : 'Choose from library'}
                  </button>
                </div>
```

- [ ] **Step 2: Verify the file still compiles**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog"
git add src/components/react/MDXEditor.tsx
git commit -m "feat: add Choose from library button to Featured Image sidebar"
```

---

### Task 4: Add the featured image picker modal

**Files:**
- Modify: `src/components/react/MDXEditor.tsx` (after the existing `showMediaBrowser` modal block, ~line 1083)

- [ ] **Step 1: Add the modal**

In `src/components/react/MDXEditor.tsx`, find the closing brace of the existing media browser modal (around line 1083):

```tsx
      )}
      {/* ── PDF Link Customization Modal ────────────────────────────────── */}
```

Insert the new modal between those two blocks:

```tsx
      )}

      {/* ── Featured Image Picker Modal ──────────────────────────────────── */}
      {showFeaturedImagePicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-zinc-100">Choose Featured Image</h2>
              <button
                onClick={() => setShowFeaturedImagePicker(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <MediaLibrary variant="picker" onSelect={handleSelectFeaturedImage} />
            </div>
          </div>
        </div>
      )}

      {/* ── PDF Link Customization Modal ────────────────────────────────── */}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Start dev server and manually verify**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog" && npm run dev
```

Open `http://localhost:4321/admin/editor` and verify:

1. The Featured Image section shows two buttons: **"Upload image"** and **"Choose from library"**
2. Clicking "Choose from library" opens the modal titled "Choose Featured Image"
3. Clicking an image in the modal sets it as the featured image and closes the modal
4. Clicking a PDF in the modal does nothing (silent ignore)
5. Clicking ✕ in the modal closes it without changing the featured image
6. After an image is set, buttons read **"Replace image"** and **"Choose different image"**
7. The existing "Upload image" upload still works as before
8. The existing body-image media browser (toolbar button) is unaffected

- [ ] **Step 4: Commit**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog"
git add src/components/react/MDXEditor.tsx
git commit -m "feat: add featured image picker modal backed by media library"
```
