import React, { useState, useEffect, useCallback } from 'react';

export interface FeaturedPost {
  slug: string;
  title: string;
  description?: string;
  featuredImage?: string;
  pubDate: string;
}

interface FeaturedCarouselProps {
  posts: FeaturedPost[];
}

export default function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Define transition delay (ms)
  const AUTO_PLAY_DELAY = 6000;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    if (isPaused || posts.length <= 1) return;
    
    const timer = setInterval(nextSlide, AUTO_PLAY_DELAY);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused, posts.length]);

  if (!posts || posts.length === 0) {
    return (
      <section className="mb-10 flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center">
        <div>
          <p className="text-white/30 text-base">No posts yet — check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="mb-10 relative group h-[420px] sm:h-[500px] lg:h-[560px] w-full" 
      aria-label="Featured posts carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#050508]">
        {posts.map((post, index) => {
          const isActive = index === currentIndex;
          
          return (
            <div
              key={post.slug}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-hidden={!isActive}
            >
              <a
                href={`/blog/${post.slug}`}
                className="relative flex h-full w-full flex-col overflow-hidden group/link outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
              >
                {/* Background Image / Gradient */}
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] ease-out ${
                      isActive ? 'scale-100 group-hover/link:scale-105' : 'scale-110'
                    }`}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900" />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                {/* Content */}
                <div className="relative flex h-full flex-1 flex-col justify-end p-6 sm:p-10 lg:p-16">
                  <div className={`max-w-3xl transition-all duration-700 delay-100 transform ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                        Featured
                      </span>
                    </div>
                    
                    <h1 className="mb-4 text-3xl font-bold leading-[1.1] tracking-tight text-white transition-colors group-hover/link:text-indigo-200 sm:text-4xl lg:text-5xl xl:text-6xl">
                      {post.title}
                    </h1>
                    
                    {post.description && (
                      <p className="mb-8 line-clamp-2 max-w-2xl text-base leading-relaxed text-zinc-300/80 sm:text-lg">
                        {post.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-95 shadow-xl shadow-white/5">
                        Read Story
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M17 7H7M17 7v10"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {posts.length > 1 && (
        <>
          {/* Progress Indicators (Dots) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 sm:bottom-10 lg:bottom-12">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  i === currentIndex 
                    ? 'w-10 bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Arrow Buttons (Optional - only visible on hover) */}
          <div className="absolute inset-y-0 left-4 right-4 z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:flex">
            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40 hover:scale-110 border border-white/10"
              aria-label="Previous slide"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40 hover:scale-110 border border-white/10"
              aria-label="Next slide"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
