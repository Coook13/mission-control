# Autonomous polish — portfolio → danilodemarco-level scroll craft

**Goal:** match the *feel* of danilodemarco.com — smooth momentum scroll, scrubbed zoom-in scenes, kinetic split-text, things that scale/scatter/move as you scroll. Content is placeholder; aesthetics + motion are the job. Reimplement techniques in ORIGINAL code (no copied HTML/assets). Free-licensed imagery only.

**Reference stack observed:** GSAP + ScrollTrigger + Splitting.js + Locomotive Scroll + Barba. My equivalent: GSAP + ScrollTrigger + (GSAP SplitText) + Lenis + Next route transitions.

**Safety:** baseline preserved on branch `fable-baseline` + folder `mission-control-BACKUP-fable-20260614`. Work on branch `autonomous-polish`. Commit after every verified iteration. Keep dev server live on :3007.

**Loop protocol (each wake-up):** read this file → pick next unchecked item → implement → `next build` clean → verify VISUALLY (freeze-frame screenshots at scroll positions, desktop + mobile) → commit → tick the box + append a log line → schedule next wake-up. Never stop. Log open questions here instead of halting.

## Backlog (priority order)
- [x] 1. FOUNDATION: GSAP+ScrollTrigger synced to Lenis (gsap.ticker drives lenis, ScrollTrigger.update on scroll). DONE (Providers.tsx GsapLenisBridge).
- [x] 2. HERO SCENE: pinned scrubbed zoom — full-bleed image push-in (scale 1→1.55), wordmark scatter+fade, mix-blend, unpins into story. DONE + verified (HeroScene.tsx). Header now fixed+mix-blend overlay = true full-bleed.
- [x] 3. KINETIC TYPE: per-word masked staggered reveals (WordReveal in motion.tsx) on story head, contact lead, story+work page-head titles. DONE & verified.
- [x] 4. WORK INDEX: staggered scroll-in rows + bigger lag-follow hover preview (settle-zoom). DONE & verified.
- [x] 5. SCROLL-VELOCITY MOTION: image velocity skew + velocity-reactive marquee drift. DONE & verified.
- [x] 6. STORY PAGE: facts pop-scale-in, timeline growing spine + rows slide-in, portrait parallax (StoryFX). DONE & verified.
- [x] 7. PAGE TRANSITIONS: ink panel-wipe on client nav (covers then slides up to reveal), skip first load. DONE & verified.
- [x] 8. IMAGE TREATMENT: clip-path mask reveal on scroll-in + hover zoom-within-frame (.pimg__zoom). DONE & verified.
- [x] 9. MAGNETIC + CURSOR: magnetic nav/logotype/contact links + cursor "view" label pill over work rows. DONE & verified.
- [ ] 10. POLISH PASS: color/contrast, spacing rhythm, mobile reflow of every scene, prefers-reduced-motion fallbacks, perf (lazy ScrollTrigger, will-change hygiene, Lighthouse).
- [ ] 11. CONTENT placeholders cleanup (remove the "tie", neutral copy) — LOW priority, user will rewrite.

## HARD RULES (user feedback)
- NO picture-swap transitions. The eye match-cut was rejected — it read as "the picture just changes." Transitions must be CONTINUOUS: one image transforming, or the page's own content (curtain/mask/scale) moving over it. The reference is inspiration only, never a literal element to copy.
- Always verify smoothness/coolness visually before committing.

## Open questions (do not block on these)
- Portrait PoC of Micky still pending (slot reserved on /story). Using placeholder frame.
- Vercel deploy needs user login — left for user.

## Log
- 2026-06-14: backup made (branch + folder). GSAP installed. Reference studied (GSAP/ScrollTrigger/Locomotive/Splitting/Barba). Starting item 1+2.
- 2026-06-14: items 1+2 DONE & verified visually (pinned scroll-zoom hero: image push-in, MICKY scatter, mix-blend). Committed ee6b011.
- 2026-06-14: item 5a (velocity skew) + fixed mix-blend header overlay DONE & verified (full-bleed hero, no strip). Committed 40e5c96.
- 2026-06-14: HERO PORTAL v2 (eye match-cut) — REJECTED by user ("just changes the picture"). Replaced with continuous CURTAIN reveal: hero pinned, astronaut zooms (scale 1.42), wordmark scatters, light page rises over it (.page-body z-index curtain). No image swap. Verified + committed 6cb388d. eye.jpg now unused (left in /img, do not reuse for swaps). NEXT: item 3 kinetic type, 4 work index, 6 story scenes, transitions, polish — all CONTINUOUS only.

- 2026-06-14: item 3 KINETIC TYPE done & verified (WordReveal per-word masked stagger; "THE story" etc.). Committed ef534bf. NEXT: item 4 work-index scrubbed reveals + bigger sticky hover image, then item 6 story-page pinned scenes — these are the bigger needle-movers toward the reference feel.

- 2026-06-14: item 4 WORK INDEX done & verified — GSAP staggered row scroll-in + bigger (400x290) lag-follow hover preview w/ settle-zoom; removed outer Reveal wrappers so rows cascade. Committed. NEXT: item 6 story-page pinned scrubbed scenes (facts scale-in, timeline draw-in), then transitions/clip-reveals/magnetic/polish.

- 2026-06-14: item 6 STORY PAGE done & verified — StoryFX adds facts pop-in, timeline spine draw + rows slide-in, portrait parallax; facts/timeline moved off framer Reveal to GSAP. Committed. NEXT: item 7 page transitions (continuous own-content wipe), 8 image clip-reveals + hover scale, 9 magnetic + cursor labels, 5b velocity marquee, 10 polish/mobile/perf.

- 2026-06-15: item 7 PAGE TRANSITIONS done & verified — template.tsx ink wipe panel ("Micky") covers on nav then slides up; first load skipped (Loader owns it). Verified home->story->work. Committed. NEXT: item 8 image clip-path mask reveals + hover scale (work-detail hero, story imagery), 9 magnetic links + cursor labels, 5b velocity marquee, 10 polish/mobile/perf.

- 2026-06-15: item 8 IMAGE TREATMENT done & verified — ParallaxImg now clip-reveals (inset 100%->0% wipe) on scroll-in + hover zoom (.pimg__zoom scale 1.05). Verified on /work/airfoillearner (clip inset(0%), hover matrix 1.05). Committed. NEXT: item 9 magnetic links/nav + cursor label states, then 5b velocity marquee, 10 polish/mobile/perf.

- 2026-06-15: item 9 MAGNETIC+CURSOR done & verified (real hover) — Magnetic.tsx (gsap.quickTo translate toward cursor, spring back) on nav+logotype+contact links; Cursor.tsx label pill ("view") + ring collapse over [data-cursor] work rows. Committed. NEXT: 5b velocity-reactive marquee, then item 10 POLISH (mobile reflow every scene @390, reduced-motion across all, perf/Lighthouse, will-change/ScrollTrigger cleanup).

- 2026-06-15: item 5b velocity marquee done — Marquee.tsx now client, JS rAF drift (base 46px/s) + Lenis velocity*6 boost, wraps by half-width, reduced-motion static. Drift confirmed (x=-1038). Committed. NEXT: item 10 POLISH PASS — mobile reflow @390 (hero wordmark, work index, story grid, contact), reduced-motion audit across all gsap/framer/Lenis, perf (ScrollTrigger cleanup, will-change), contrast/spacing. Biggest remaining needle-mover.

- 2026-06-15: item 10a MOBILE @390 done & verified — hero MICKY one line (clamp 21vw + nowrap), fixed story-page/facts/timeline/detail/index grids stacking (appended late base rules were overriding the 880px media block; added end-of-file overrides). No overflow on /, /story, /work. Hover-preview hidden <880px. NEXT: 10b reduced-motion audit (every animated component degrades), 10c perf (ScrollTrigger cleanup/will-change), 10d contrast/spacing.

- 2026-06-15: item 10b reduced-motion AUDIT done. Guards confirmed: HeroScene/StoryFX/Marquee/Cursor/Magnetic early-return on reduce; WordReveal via useInViewOnce(reduce)→visible + @media reduce .mask__inner transform:none; template wipe snaps transform off instantly (framer reducedMotion) + content opacity fades; Loader always unmounts via timer. FIXED: ParallaxImg now reduce-aware (initial=false, no clip-path/skew/parallax) so images never stuck hidden. Verified non-reduce path intact (clip inset 0
- 2026-06-15: item 10b reduced-motion AUDIT done. Guards confirmed on all animated components: HeroScene / StoryFX / Marquee / Cursor / Magnetic early-return on reduce; WordReveal via useInViewOnce + reduce CSS .mask__inner transform:none; template wipe snaps off + content opacity fades; Loader always unmounts. FIXED: ParallaxImg now reduce-aware (initial false, no clip/skew/parallax) so images never stuck hidden. Verified non-reduce path intact. ACCEPTED minor: Lenis momentum stays under reduce (mild, not a vestibular trigger; clean disable risks SSR mismatch). Playwright MCP cannot emulate reduce; verified by construction. NEXT: 10c perf, 10d contrast/spacing.

- 2026-06-15: item 10c PERF/correctness done. Killed next/image fill console warnings (hero -> plain eager img with fetchPriority high; zoom intact, verified scale 1.42 on scroll). useGSAP auto-reverts ScrollTriggers on unmount (trusted; HeroScene/StoryFX/HoverIndex all scoped). ParallaxImg/story/contact already plain imgs (no warnings). will-change only on actively-animated layers. NEXT: 10d contrast/spacing audit (--dim #6E6A63 on #F5F4F0 ~ check legibility, section rhythm, heading scale), then 11 content cleanup, then final re-audit vs reference + refine weakest detail.

- 2026-06-15: item 10d contrast/spacing audit done. Section rhythm + heading ladder consistent (verified home desktop). --dim bumped #6E6A63 -> #5F5C54 (AA 4.9 -> ~5.5:1) for crisper labels/captions/years, still soft. Spacing healthy, no cramped fixes needed. NEXT: 11 content cleanup (low) then FINAL RE-AUDIT loop — refine single weakest detail per cycle (hero easing, transition timing, type tracking, image treatment).

- 2026-06-16: DANILO-PARITY PLAN — started executing approved plan (plans/ok-i-need-a-linear-bird.md). Batch A (the 3 visible bugs) DONE & verified:
  - A3 "1 Issue": diagnosed as a Grammarly browser-extension hydration mismatch on <body> (data-gr-ext-installed / data-new-gr-c-s-check-loaded), NOT a code bug. Fixed with suppressHydrationWarning on <html>+<body> (standard Next remedy). Console now clean (preview_console_logs: no errors).
  - A1 stuck hover-preview (HoverIndex): added useLenis(()=>clear) so ANY scroll dismisses the preview (was only clearing on row mouseleave -> stuck), + list-wrapper onMouseLeave + coarse-pointer (touch) guard. Verified by construction + tsc/eslint clean (synthetic mouseenter can't drive React delegation to set the preview headlessly).
  - A2 header overlap (new client components/Header.tsx, editorial.tsx re-exports it): Lenis-driven auto-hide on scroll-down / reveal on scroll-up (6px dead-zone, <90px always shown), keeps mix-blend. CSS .header transition + .header--hidden translateY(-130%). VERIFIED via lenis.scrollTo + manual raf pump: y1500 -> hidden=true; back to y900 -> hidden=false.
  - Exposed window.lenis in dev only (Providers) so the verification protocol can drive Lenis (preview tab freezes rAF; pump lenis.raf manually). tsc --noEmit clean, eslint 0 errors. Committed on autonomous-polish.
  NEXT: B1 — cached data-speed parallax engine (the core needle-mover toward danilo feel).
