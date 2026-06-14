# Autonomous polish — portfolio → danilodemarco-level scroll craft

**Goal:** match the *feel* of danilodemarco.com — smooth momentum scroll, scrubbed zoom-in scenes, kinetic split-text, things that scale/scatter/move as you scroll. Content is placeholder; aesthetics + motion are the job. Reimplement techniques in ORIGINAL code (no copied HTML/assets). Free-licensed imagery only.

**Reference stack observed:** GSAP + ScrollTrigger + Splitting.js + Locomotive Scroll + Barba. My equivalent: GSAP + ScrollTrigger + (GSAP SplitText) + Lenis + Next route transitions.

**Safety:** baseline preserved on branch `fable-baseline` + folder `mission-control-BACKUP-fable-20260614`. Work on branch `autonomous-polish`. Commit after every verified iteration. Keep dev server live on :3007.

**Loop protocol (each wake-up):** read this file → pick next unchecked item → implement → `next build` clean → verify VISUALLY (freeze-frame screenshots at scroll positions, desktop + mobile) → commit → tick the box + append a log line → schedule next wake-up. Never stop. Log open questions here instead of halting.

## Backlog (priority order)
- [ ] 1. FOUNDATION: GSAP+ScrollTrigger synced to Lenis (gsap.ticker drives lenis, ScrollTrigger.update on scroll). Register ScrollTrigger + SplitText.
- [ ] 2. HERO SCENE: pinned scrubbed zoom — full-bleed focal image pushes in (scale), wordmark scatters/explodes + fades, unpins into story. The signature "zoom into the eye" moment.
- [ ] 3. KINETIC TYPE: SplitText char/line reveals on every heading (scrubbed or on-enter stagger, masked). Replace discrete framer reveals on headings.
- [ ] 4. WORK INDEX: scrubbed row entrance + bigger cursor-image that scales/sticks; consider pinned horizontal gallery strip.
- [ ] 5. SCROLL-VELOCITY MOTION: skew/scale images by scroll velocity (the "everything is moving" feel). Velocity-reactive marquee speed.
- [ ] 6. STORY PAGE: pinned scrubbed parallax layers; facts numbers scale/þcount on enter; timeline draws in.
- [ ] 7. ROUTE TRANSITIONS: cover-panel wipe between pages (Barba equivalent via template.tsx + overlay).
- [ ] 8. IMAGE TREATMENT: clip-path reveal on images (mask wipe), subtle hover scale, grain consistency.
- [ ] 9. MAGNETIC + CURSOR: magnetic nav/links, cursor label states ("view"), refine.
- [ ] 10. POLISH PASS: color/contrast, spacing rhythm, mobile reflow of every scene, prefers-reduced-motion fallbacks, perf (lazy ScrollTrigger, will-change hygiene, Lighthouse).
- [ ] 11. CONTENT placeholders cleanup (remove the "tie", neutral copy) — LOW priority, user will rewrite.

## Open questions (do not block on these)
- Portrait PoC of Micky still pending (slot reserved on /story). Using placeholder frame.
- Vercel deploy needs user login — left for user.

## Log
- 2026-06-14: backup made (branch + folder). GSAP installed. Reference studied (GSAP/ScrollTrigger/Locomotive/Splitting/Barba). Starting item 1+2.
