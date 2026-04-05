import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ImageMetadata {
  name: string;
  url: string;
  size: number;
  mtime: number;
}

const Icon = {
  Plus: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Trash: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  Clipboard: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.492 1.084 1.24 1.084 2.088v14.25a2.25 2.25 0 0 1-2.25 2.25H9a2.25 2.25 0 0 1-2.25-2.25V5.976c0-.848.438-1.596 1.084-2.088m12 0L12 12m0 0-6.75-6.75M12 12l6.75 6.75M12 12l-6.75 6.75" />
    </svg>
  ),
  Check: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  Photo: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  Document: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  Search: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  ),
  Sort: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m9-6.5L21 14.5m0 0L16.5 19m4.5-4.5h-13.5" />
    </svg>
  ),
};

interface MediaLibraryProps {
  onSelect?: (image: ImageMetadata) => void;
  variant?: 'manage' | 'picker';
}

export default function MediaLibrary({ onSelect, variant = 'manage' }: MediaLibraryProps) {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageMetadata | null>(null);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Search, Filter & Sort state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-images');
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCopy = (e: React.MouseEvent, url: string, name: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
    showToast('Copied to clipboard');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      showToast('Image uploaded successfully');
      fetchImages();
    } catch (err) {
      showToast('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/delete-image?name=${encodeURIComponent(deleteTarget.name)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      showToast('Deleted');
      setImages(prev => prev.filter(img => img.name !== deleteTarget.name));
      setDeleteTarget(null);
    } catch (err) {
      showToast('Error deleting media');
    }
  };



  const toggleSelection = (name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedNames.size === images.length) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(images.map(img => img.name)));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/admin/bulk-delete-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: Array.from(selectedNames) }),
      });

      if (!res.ok) throw new Error('Bulk delete failed');

      const data = await res.json();
      const successCount = data.results.success.length;
      
      showToast(`Deleted ${successCount} items`);
      setImages(prev => prev.filter(img => !selectedNames.has(img.name)));
      setSelectedNames(new Set());
      setIsSelectionMode(false);
      setShowBulkDeleteModal(false);
    } catch (err) {
      showToast('Error during bulk deletion');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const filteredImages = useMemo(() => {
    let result = [...images];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(img => img.name.toLowerCase().includes(q));
    }

    // Type Filter
    if (filterType !== 'all') {
      result = result.filter(img => {
        const isPdf = img.url.toLowerCase().endsWith('.pdf');
        return filterType === 'pdf' ? isPdf : !isPdf;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') return (b.mtime || 0) - (a.mtime || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [images, search, filterType, sortBy]);

  const { displayImages, displayFiles } = useMemo(() => {
    const imgOnly = filteredImages.filter(img => !img.url.toLowerCase().endsWith('.pdf'));
    const pdfOnly = filteredImages.filter(img => img.url.toLowerCase().endsWith('.pdf'));
    return { displayImages: imgOnly, displayFiles: pdfOnly };
  }, [filteredImages]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`space-y-6 ${variant === 'manage' ? 'max-w-6xl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Media Library</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {variant === 'picker' ? 'Select an item for your post' : 'Manage your uploaded media'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {variant === 'manage' && images.length > 0 && (
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedNames(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSelectionMode 
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {isSelectionMode ? 'Cancel Selection' : 'Select'}
            </button>
          )}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer">
            <Icon.Plus className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Discovery Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2">
        <div className="relative w-full sm:w-64 group">
          <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search filenames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0">
            {(['all', 'image', 'pdf'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterType === t 
                    ? 'bg-zinc-800 text-blue-400 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0" />

          <button
            onClick={() => setSortBy(s => s === 'date' ? 'name' : 'date')}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
          >
            <Icon.Sort className="w-3 h-3" />
            SORT BY: {sortBy.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {isSelectionMode && (
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-blue-400">
              {selectedNames.size} items selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              {selectedNames.size === images.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <button
            disabled={selectedNames.size === 0}
            onClick={() => setShowBulkDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon.Trash className="w-3.5 h-3.5" />
            Delete Selected
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
          <Icon.Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">
            {images.length === 0 ? 'No images uploaded yet.' : 'No media matches your search filters.'}
          </p>
          {images.length > 0 && (
            <button
              onClick={() => { setSearch(''); setFilterType('all'); }}
              className="mt-4 text-xs font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {displayImages.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Icon.Photo className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-100">Images</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{displayImages.length} items</p>
                </div>
                <div className="h-px flex-1 bg-zinc-800/50 ml-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayImages.map((image) => (
                  <div
                    key={image.name}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleSelection(image.name);
                      } else if (onSelect) {
                        onSelect(image);
                      }
                    }}
                    className={`group relative aspect-square bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
                      isSelectionMode 
                        ? selectedNames.has(image.name) 
                          ? 'border-blue-500 ring-2 ring-blue-500/20' 
                          : 'border-zinc-800 hover:border-zinc-600'
                        : 'border-zinc-800 hover:border-zinc-700'
                    } ${
                      (onSelect || isSelectionMode) ? 'cursor-pointer active:scale-[0.98]' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {isSelectionMode && (
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-colors z-10 ${
                        selectedNames.has(image.name) 
                          ? 'bg-blue-600 border-blue-500' 
                          : 'bg-zinc-900/60 border-zinc-500'
                      }`}>
                        {selectedNames.has(image.name) && <Icon.Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}

                    <div className={`absolute inset-0 bg-zinc-950/60 transition-opacity flex flex-col justify-between p-2 ${
                      isSelectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="flex justify-end gap-1.5">
                        {variant === 'manage' && (
                          <>
                            <button
                              onClick={(e) => handleCopy(e, image.url, image.name)}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                              title="Copy URL"
                            >
                              {copiedName === image.name ? <Icon.Check className="w-3.5 h-3.5" /> : <Icon.Clipboard className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(image); }}
                              className="p-1.5 rounded-lg bg-zinc-800 text-red-400 hover:bg-red-950/50 transition-colors"
                              title="Delete"
                            >
                              <Icon.Trash className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {variant === 'picker' && (
                          <div className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                            SELECT
                          </div>
                        )}
                      </div>
                      <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg p-2">
                        <p className="text-[10px] text-zinc-100 truncate font-mono">{image.name}</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{formatSize(image.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {displayFiles.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Icon.Document className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-100">Files</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{displayFiles.length} items</p>
                </div>
                <div className="h-px flex-1 bg-zinc-800/50 ml-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {displayFiles.map((image) => (
                  <div
                    key={image.name}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleSelection(image.name);
                      } else if (onSelect) {
                        onSelect(image);
                      }
                    }}
                    className={`group relative aspect-square bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
                      isSelectionMode 
                        ? selectedNames.has(image.name) 
                          ? 'border-blue-500 ring-2 ring-blue-500/20' 
                          : 'border-zinc-800 hover:border-zinc-600'
                        : 'border-zinc-800 hover:border-zinc-700'
                    } ${
                      (onSelect || isSelectionMode) ? 'cursor-pointer active:scale-[0.98]' : ''
                    }`}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3 border-b border-zinc-800 pb-2">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Icon.Document className="w-6 h-6 text-red-500" />
                      </div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">PDF</span>
                    </div>
                    
                    {isSelectionMode && (
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-colors z-10 ${
                        selectedNames.has(image.name) 
                          ? 'bg-blue-600 border-blue-500' 
                          : 'bg-zinc-900/60 border-zinc-500'
                      }`}>
                        {selectedNames.has(image.name) && <Icon.Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}

                    <div className={`absolute inset-0 bg-zinc-950/60 transition-opacity flex flex-col justify-between p-2 ${
                      isSelectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="flex justify-end gap-1.5">
                        {variant === 'manage' && (
                          <>
                            <button
                              onClick={(e) => handleCopy(e, image.url, image.name)}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                              title="Copy URL"
                            >
                              {copiedName === image.name ? <Icon.Check className="w-3.5 h-3.5" /> : <Icon.Clipboard className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(image); }}
                              className="p-1.5 rounded-lg bg-zinc-800 text-red-400 hover:bg-red-950/50 transition-colors"
                              title="Delete"
                            >
                              <Icon.Trash className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {variant === 'picker' && (
                          <div className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                            SELECT
                          </div>
                        )}
                      </div>
                      <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg p-2">
                        <p className="text-[10px] text-zinc-100 truncate font-mono">{image.name}</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{formatSize(image.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Bulk Delete confirmation modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0">
                <Icon.Trash className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Bulk Delete Media</h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="text-zinc-200 font-bold">{selectedNames.size}</span> selected items? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0">
                <Icon.Trash className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Delete Media</h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="text-zinc-200 font-medium">"{deleteTarget.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Delete Media
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-medium px-4 py-2 rounded-full shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
