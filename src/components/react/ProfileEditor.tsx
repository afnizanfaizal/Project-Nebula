// src/components/react/ProfileEditor.tsx
// Admin editor for the site About/Profile page content
import { useState, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name:         string;
  title:        string;
  bio:          string;
  profilePhoto: string;
  skills:       string[];
}

interface Props {
  initialProfile: ProfileData;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Save: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Photo: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
    </svg>
  ),
  Upload: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Plus: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m7.5-7.5h-15"/>
    </svg>
  ),
  Trash: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
    </svg>
  ),
  Check: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m4.5 12.75 6 6 9-13.5"/>
    </svg>
  ),
  ExternalLink: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

// ── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-400">
      {children}
    </label>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/20 backdrop-blur-sm transition-all focus:border-indigo-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-indigo-500/30 ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/20 backdrop-blur-sm transition-all focus:border-indigo-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none ${className}`}
    />
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400">{title}</h3>
      {children}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ProfileEditor({ initialProfile }: Props) {
  const [profile, setProfile] = useState<ProfileData>(() => ({
    name:         initialProfile.name         ?? '',
    title:        initialProfile.title        ?? '',
    bio:          initialProfile.bio          ?? '',
    profilePhoto: initialProfile.profilePhoto ?? '',
    skills:       initialProfile.skills       ?? [],
  }));
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError]   = useState('');
  const [skillInput, setSkillInput]   = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile(p => ({ ...p, [key]: value }));
    setSaved(false);
  }, []);

  // ── Profile photo: dedicated upload, replaces existing ──────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    setPhotoError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/upload-profile-photo', { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Upload failed');
      // URL already saved to Firestore by the endpoint; sync local state too
      set('profilePhoto', data.url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // ── Skills ────────────────────────────────────────────────────────────────
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || profile.skills.includes(s)) return;
    set('skills', [...profile.skills, s]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    set('skills', profile.skills.filter(s => s !== skill));
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  // ── Save all other fields ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const r = await fetch('/api/admin/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error ?? 'Save failed');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">About Page</h1>
          <p className="mt-0.5 text-sm text-white/30">Edit your public profile and bio</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <Icon.ExternalLink className="w-3.5 h-3.5" />
            Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : saved ? (
              <Icon.Check className="w-4 h-4" />
            ) : (
              <Icon.Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:col-span-2">

          {/* Identity */}
          <SectionCard title="Identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profile.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <Label>Professional Title</Label>
                <Input
                  value={profile.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="AI Innovation & Tech Leader"
                />
              </div>
            </div>
          </SectionCard>

          {/* Bio */}
          <SectionCard title="Bio">
            <Label>About (use line breaks for multiple paragraphs)</Label>
            <Textarea
              rows={8}
              value={profile.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Write your bio here. Each line break becomes a new paragraph on the public page."
            />
          </SectionCard>

        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Profile Photo — dedicated upload, not from media library */}
          <SectionCard title="Profile Photo">
            <div className="flex flex-col items-center gap-4">

              {/* Circular preview with purple glow */}
              <div className="relative h-36 w-36">
                <div aria-hidden="true" className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/60 via-indigo-600/40 to-transparent blur-[16px] scale-110" />
                <div className="relative h-full w-full rounded-full p-[3px] bg-gradient-to-br from-purple-500/80 via-indigo-500/60 to-purple-800/40 shadow-xl shadow-purple-900/50">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt="Profile preview"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-purple-900/80 via-indigo-900/70 to-slate-900">
                      <Icon.Photo className="h-10 w-10 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Uploading spinner overlay */}
                {photoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
                  </div>
                )}
              </div>

              {/* Upload button */}
              <label className={`cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-sm text-white/60 transition-all hover:border-indigo-500/40 hover:text-indigo-300 ${photoUploading ? 'pointer-events-none opacity-50' : ''}`}>
                <Icon.Upload className="w-4 h-4" />
                {photoUploading ? 'Uploading…' : profile.profilePhoto ? 'Replace Photo' : 'Upload Photo'}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={photoUploading}
                />
              </label>

              <p className="text-[11px] text-white/20 text-center">
                JPEG, PNG or WebP · max 5 MB<br />
                Uploading a new photo replaces the existing one.
              </p>

              {photoError && (
                <p className="text-xs text-red-400 text-center" role="alert">{photoError}</p>
              )}
            </div>
          </SectionCard>

          {/* Expertise / Skills */}
          <SectionCard title="Expertise / Skills">
            <div className="mb-3 flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="cursor-pointer text-indigo-300/50 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${skill}`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill…"
              />
              <button
                onClick={addSkill}
                className="cursor-pointer flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white/50 transition-colors hover:border-indigo-500/40 hover:text-indigo-300"
                aria-label="Add skill"
              >
                <Icon.Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-white/20">Press Enter or click + to add</p>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
