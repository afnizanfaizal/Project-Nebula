const v=document.getElementById("all-posts-data");if(!v)throw new Error("posts data missing");const h=JSON.parse(v.textContent??"[]");let a=[...h],o=1;function w(e){const t=Date.now()-new Date(e).getTime(),i=Math.floor(t/36e5),r=Math.floor(t/864e5),n=Math.floor(r/30);return i<1?"Just now":i<24?`${i}h ago`:r<30?`${r}d ago`:n<12?`${n}mo ago`:new Intl.DateTimeFormat("en-US",{month:"short",year:"numeric"}).format(new Date(e))}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function x(e){const t=e.tags.slice(0,2).map(n=>`<span class="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">${d(n)}</span>`).join(""),i=e.featuredImage?`<img src="${d(e.featuredImage)}" alt="${d(e.title)}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />`:`<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-slate-900/60">
             <svg class="h-10 w-10 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg>
           </div>`,r=e.description?`<p class="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-white/45">${d(e.description)}</p>`:"";return`
        <a href="/blog/${d(e.slug)}"
           class="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-xl hover:shadow-indigo-500/[0.08]">
          <div class="relative aspect-video overflow-hidden">
            ${i}
            <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050508]/80 to-transparent"></div>
          </div>
          <div class="flex flex-1 flex-col p-5">
            ${t?`<div class="mb-3 flex flex-wrap gap-1.5">${t}</div>`:""}
            <h3 class="mb-2 line-clamp-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-indigo-200">
              ${d(e.title)}
            </h3>
            ${r}
            <div class="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-3">
              <time datetime="${d(e.pubDate)}" class="text-xs text-white/30">${w(e.pubDate)}</time>
              <svg class="h-4 w-4 text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </a>`}function c(){const e=document.getElementById("posts-grid"),t=document.getElementById("empty-state"),i=document.getElementById("pagination"),r=document.getElementById("posts-count");if(r.textContent=`${a.length} ${a.length===1?"post":"posts"}`,a.length===0){e.classList.add("hidden"),t.classList.remove("hidden"),i.classList.add("hidden");return}e.classList.remove("hidden"),t.classList.add("hidden");const n=(o-1)*6,m=a.slice(n,n+6);e.innerHTML=m.map(x).join(""),b()}function b(){const e=document.getElementById("pagination"),t=document.getElementById("prev-btn"),i=document.getElementById("next-btn"),r=document.getElementById("page-numbers"),n=Math.ceil(a.length/6);if(n<=1){e.classList.add("hidden");return}e.classList.remove("hidden"),t.disabled=o===1,i.disabled=o===n;const m=5;let l=[];if(n<=m)l=Array.from({length:n},(s,g)=>g+1);else{l=[1];const s=Math.max(2,o-1),g=Math.min(n-1,o+1);s>2&&l.push("…");for(let f=s;f<=g;f++)l.push(f);g<n-1&&l.push("…"),l.push(n)}r.innerHTML=l.map(s=>s==="…"?'<span class="flex h-9 w-9 items-center justify-center text-sm text-white/25">…</span>':`<button
               role="listitem"
               data-page="${s}"
               aria-label="Page ${s}"
               aria-current="${s===o?"page":"false"}"
               class="h-9 w-9 rounded-lg text-sm transition-all ${s===o?"bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/30":"border border-white/10 bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white"}"
             >${s}</button>`).join(""),r.querySelectorAll("[data-page]").forEach(s=>{s.addEventListener("click",()=>{o=parseInt(s.dataset.page),c(),document.getElementById("recent-section")?.scrollIntoView({behavior:"smooth",block:"start"})})})}const u=document.getElementById("search-input"),E=document.getElementById("clear-search"),y=document.getElementById("prev-btn"),I=document.getElementById("next-btn");let p;u?.addEventListener("input",e=>{clearTimeout(p),p=setTimeout(()=>{const t=e.target.value.toLowerCase().trim();a=t?h.filter(i=>i.title.toLowerCase().includes(t)||(i.description??"").toLowerCase().includes(t)||i.tags.some(r=>r.toLowerCase().includes(t))):[...h],o=1,c()},200)});E?.addEventListener("click",()=>{u&&(u.value="",u.focus()),a=[...h],o=1,c()});y?.addEventListener("click",()=>{o>1&&(o--,c(),document.getElementById("recent-section")?.scrollIntoView({behavior:"smooth",block:"start"}))});I?.addEventListener("click",()=>{const e=Math.ceil(a.length/6);o<e&&(o++,c(),document.getElementById("recent-section")?.scrollIntoView({behavior:"smooth",block:"start"}))});b();
