# Featured Image — Media Library Picker

**Date:** 2026-04-06
**Status:** Approved

## Problem

The Featured Image section in the blog post editor sidebar only supports uploading a new file. Users who have already uploaded images to the Media Library must re-upload them to use them as a featured image.

## Goal

Allow users to pick an existing image from the Media Library as the featured image, while keeping the existing "Upload image" option.

## Approach

Option A — separate modal. Add a dedicated `showFeaturedImagePicker` state and a new `MediaLibrary` picker modal scoped only to featured image selection. The existing body-image media browser (`showMediaBrowser`) is left untouched.

## Changes

### `src/components/react/MDXEditor.tsx`

**1. New state**

```ts
const [showFeaturedImagePicker, setShowFeaturedImagePicker] = useState(false);
```

**2. New handler**

```ts
const handleSelectFeaturedImage = (image: ImageMetadata) => {
  // PDFs are not valid featured images — ignore silently
  if (image.url.toLowerCase().endsWith('.pdf')) return;
  setMeta(m => ({ ...m, featuredImage: image.url }));
  setShowFeaturedImagePicker(false);
};
```

**3. Featured Image section UI** (sidebar, ~line 860)

Replace the single upload `<label>` with two stacked buttons:

- **Upload image** — existing `<label>` file input, unchanged
- **Choose from library** — new `<button>` that sets `showFeaturedImagePicker = true`

Both render whether or not an image is currently set (labelled "Replace image" / "Choose from library" when one exists, matching the existing "Replace image" wording pattern).

**4. New modal**

Modelled on the existing `showMediaBrowser` modal:

```tsx
{showFeaturedImagePicker && (
  <div className="fixed inset-0 z-[100] ...backdrop...">
    <div className="...card...">
      <header>
        <h2>Choose Featured Image</h2>
        <button onClick={() => setShowFeaturedImagePicker(false)}>✕</button>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <MediaLibrary variant="picker" onSelect={handleSelectFeaturedImage} />
      </div>
    </div>
  </div>
)}
```

## Scope

- **Only file changed:** `src/components/react/MDXEditor.tsx`
- No changes to `MediaLibrary.tsx`, API routes, or data schemas
- `featuredImage` is already saved and loaded correctly — no backend work needed

## Out of scope

- Filtering the picker to images-only at the `MediaLibrary` level (PDFs are silently ignored in the handler)
- Any changes to the body-image media browser flow
