const b=document.getElementById("all-projects-data"),g=JSON.parse(b?.textContent??"[]");let r=[...g],n=1;const c=document.getElementById("posts-grid"),u=document.getElementById("empty-state"),x=document.getElementById("posts-count"),w=document.getElementById("search-input"),h=document.getElementById("pagination"),p=document.getElementById("prev-btn"),f=document.getElementById("next-btn"),m=document.getElementById("page-numbers");function l(o){return o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function d(){if(x.textContent=`${r.length} ${r.length===1?"project":"projects"}`,r.length===0){c.classList.add("hidden"),u.classList.remove("hidden"),h.classList.add("hidden");return}c.classList.remove("hidden"),u.classList.add("hidden");const o=(n-1)*6,s=r.slice(o,o+6);c.innerHTML=s.map(e=>{const t=e.tags.filter(i=>i.toUpperCase()!=="PROJECT").slice(0,2).map(i=>`<span class="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] lowercase text-indigo-300">#${l(i)}</span>`).join(""),a=e.featuredImage?`<img src="${l(e.featuredImage)}" alt="" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />`:'<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-slate-900/60"><svg class="h-10 w-10 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg></div>';return`
          <a href="/blog/${l(e.slug)}" class="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-xl hover:shadow-indigo-500/[0.08]">
            <div class="relative aspect-video overflow-hidden">
              ${a}
              <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050508]/80 to-transparent"></div>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <div class="mb-3 flex flex-wrap gap-1.5">${t}</div>
              <h3 class="mb-2 line-clamp-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-indigo-200">
                ${l(e.title)}
              </h3>
              <p class="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-white/45">${l(e.description)}</p>
              <div class="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-3">
                <span class="text-[10px] text-white/30 uppercase tracking-widest font-medium">Project</span>
                <svg class="h-4 w-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </a>`}).join(""),v()}function v(){const o=Math.ceil(r.length/6);if(o<=1){h.classList.add("hidden");return}h.classList.remove("hidden"),p.disabled=n===1,f.disabled=n===o;const s=5;let e=[];if(o<=s)e=Array.from({length:o},(t,a)=>a+1);else{e=[1];const t=Math.max(2,n-1),a=Math.min(o-1,n+1);t>2&&e.push("…");for(let i=t;i<=a;i++)e.push(i);a<o-1&&e.push("…"),e.push(o)}m.innerHTML=e.map(t=>t==="…"?'<span class="flex h-9 w-9 items-center justify-center text-sm text-white/25">…</span>':`<button
               role="listitem"
               data-page="${t}"
               aria-label="Page ${t}"
               aria-current="${t===n?"page":"false"}"
               class="h-9 w-9 rounded-lg text-sm transition-all cursor-pointer ${t===n?"bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/30":"border border-white/10 bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white"}"
             >${t}</button>`).join(""),m.querySelectorAll("[data-page]").forEach(t=>{t.addEventListener("click",()=>{n=parseInt(t.dataset.page),d(),document.getElementById("projects-section")?.scrollIntoView({behavior:"smooth",block:"start"})})})}w?.addEventListener("input",o=>{const s=o.target.value.toLowerCase().trim();r=s?g.filter(e=>e.title.toLowerCase().includes(s)||(e.description||"").toLowerCase().includes(s)||e.tags.some(t=>t.toLowerCase().includes(s))):[...g],n=1,d()});p?.addEventListener("click",()=>{n>1&&(n--,d(),document.getElementById("projects-section")?.scrollIntoView({behavior:"smooth",block:"start"}))});f?.addEventListener("click",()=>{const o=Math.ceil(r.length/6);n<o&&(n++,d(),document.getElementById("projects-section")?.scrollIntoView({behavior:"smooth",block:"start"}))});v();
