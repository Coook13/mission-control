# Autonomous polish — portfolio → danilodemarco-level scroll craft

**Goal:** match the *feel* of danilodemarco.com — smooth momentum scroll, scrubbed zoom-in scenes, kinetic split-text, things that scale/scatter/move as you scroll. Content is placeholder; aesthetics + motion are the job. Reimplement techniques in ORIGINAL code (no copied HTML/assets). Free-licensed imagery only.

**Reference stack observed:** GSAP + ScrollTrigger + Splitting.js + Locomotive Scroll + Barba. My equivalent: GSAP + ScrollTrigger + (GSAP SplitText) + Lenis + Next route transitions.

**Safety:** baseline preserved on branch `fable-baseline` + folder `mission-control-BACKUP-fable-20260614`. Work on branch `autonomous-polish`. Commit after every verified iteration. Keep dev server live on :3007.

**Loop protocol (each wake-up):** read this file → pick next unchecked item → implement → `next build` clean → verify VISUALLY (freeze-frame screenshots at scroll positions, desktop + mobile) → commit → tick the box + append a log line → schedule next wake-up. Never stop. Log open questions here instead of halting.

## Backlog (priority order)
- [x] 1. FOUNDATION: GSAP+ScrollTrigger synced to Lenis (gsap.ticker drives lenis, ScrollTrigger.update on scroll). DONE (Providers.tsx GsapLenisBridge).
- [x] 2. HERO SCENE: pinned scrubbed zoom — full-bleed image push-in (scale 1→1.55), wordmark scatter+fade, mix-blend, unpins into story. DONE + verified (HeroScene.tsx). Header now fixed+mix-blend overlay = true full-bleed.
- [x] 3. KINETIC TYPE: per-word masked staggered reveals (WordReveal in motion.tsx) on story head, contact lead, story+work page-head titles. DONE & verified.
- [ ] 4. WORK INDEX: scrubbed row entrance (stagger up on enter) + bigger cursor-image that scales/sticks; consider pinned horizontal gallery strip.
- [~] 5. SCROLL-VELOCITY MOTION: image skew by velocity DONE (ParallaxImg useVelocity skewY). TODO: velocity-reactive marquee speed.
- [ ] 6. STORY PAGE: pinned scrubbed parallax layers; facts numbers scale/þcount on enter; timeline draws in.
- [ ] 7. ROUTE TRANSITIONS: cover-panel wipe between pages (Barba equivalent via template.tsx + overlay).
- [ ] 8. IMAGE TREATMENT: clip-path reveal on images (mask wipe), subtle hover scale, grain consistency.
- [ ] 9. MAGNETIC + CURSOR: magnetic nav/links, cursor label states ("view"), refine.
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
