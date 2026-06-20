"use client";

import { profile } from "@/lib/site-data";
import { RingGlyph } from "./RingGlyph";

/* Hero — pure black void, a fine reactive starfield, and his headline set huge
   in grotesque caps, with the O of WORK rendered as a glowing particle ring:
   a black hole built into the wordmark. His copy; the look follows the deep,
   stark, editorial register of an award-grade space site. */
export function BlackHoleHero() {
  return (
    <section className="bhx-hero" aria-label="Intro">
      <div className="bhx-hero__inner">
        <p className="bhx-kicker">
          <span>{profile.name}</span>
          <span className="bhx-kicker__dim">Founder · Engineer · Strategist</span>
        </p>

        <h1 className="bhx-wordmark" aria-label={`${profile.headline.line1} ${profile.headline.line2}`}>
          <span className="bhx-line">I&nbsp;BUILD&nbsp;THINGS</span>
          <span className="bhx-line">
            THAT&nbsp;W
            <span className="bhx-o" aria-hidden="true">
              <RingGlyph className="bhx-o__c" />
            </span>
            RK
          </span>
        </h1>

        <p className="bhx-sub">{profile.subline}</p>
      </div>

      <div className="bhx-cue" aria-hidden="true">
        <span>scroll</span>
      </div>
    </section>
  );
}
