import type { Metadata } from "next";
import Image from "next/image";
import { facts, profile, storyLong, timeline } from "@/lib/site-data";
import { Footer, Header } from "@/components/editorial";
import { Reveal, WordReveal } from "@/components/motion";
import { Marquee } from "@/components/Marquee";
import { StoryFX } from "@/components/StoryFX";
import { SecLabel } from "@/components/SecLabel";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";

export const metadata: Metadata = { title: "Story" };

/* Portrait slot is next/image-ready: set a path (e.g. "/img/portrait.jpg") and
   the frame renders a graded monochrome photo; leave undefined to keep the
   accepted "MT" monogram empty state. One field flips it. */
const portraitSrc: string | undefined = "/img/portrait.jpg";

export default function StoryPage() {
  return (
    <div className="page-dark">
      <SpaceBackdrop />
      <Header />
      <StoryFX />
      <main>
        <section className="page-head">
          <div className="shell">
            <WordReveal
              as="h1"
              className="page-head__title"
              delay={0.15}
              speed={1.22}
              words={[{ t: "THE" }, { t: "story", serif: true }]}
            />
            <p className="page-head__sub" data-speed={0.9}>
              Bangkok raised. Manchester trained. Founder shaped.
            </p>
          </div>
        </section>

        <section className="section-ed--tight section-ed story-bio">
          <div className="shell">
            <div className="story-page">
              <Reveal className="story-page__body">
                {storyLong.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>
              <Reveal delay={0.12}>
                <figure className="portrait">
                  <div className="portrait__frame">
                    {portraitSrc ? (
                      <Image
                        className="portrait__img"
                        src={portraitSrc}
                        alt={profile.name}
                        fill
                        sizes="(max-width: 720px) 90vw, 380px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <>
                        <span className="portrait__mark serif" aria-hidden="true">
                          MT
                        </span>
                        <span className="portrait__rule" aria-hidden="true" />
                      </>
                    )}
                  </div>
                  <figcaption data-speed={0.9}>{profile.name}</figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        <Marquee outline items={["NUMBERS", "THE NUMBERS", "NUMBERS", "THE NUMBERS"]} duration={24} />

        <section className="section-ed--tight section-ed story-numbers">
          <div className="shell">
            <SecLabel speed={1.2}>Facts</SecLabel>
            <div className="facts">
              {facts.map((f, i) => (
                <div key={i} className="fact">
                  <span className="fact__n">{f.n}</span>
                  <span className="fact__k">{f.k}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-ed--tight section-ed story-timeline">
          <div className="shell">
            <SecLabel speed={1.2}>Timeline</SecLabel>
            <div className="timeline">
              <span className="timeline__line" aria-hidden="true" />
              {timeline.map((t) => (
                <div key={t.year} className="timeline__row">
                  <span className="timeline__year serif">{t.year}</span>
                  <span className="timeline__what">{t.what}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
