import type { Metadata } from "next";
import { facts, profile, storyLong, timeline } from "@/lib/site-data";
import { ContactSection, Footer, Header } from "@/components/editorial";
import { Lines, Reveal } from "@/components/motion";
import { Marquee } from "@/components/Marquee";
import { PixelMicky } from "@/components/PixelMicky";

export const metadata: Metadata = { title: "Story | Micky Thanawarothon" };

export default function StoryPage() {
  return (
    <>
      <Header />
      <main>
        <section className="page-head">
          <div className="shell">
            <Lines
              as="h1"
              className="page-head__title"
              delay={0.15}
              lines={[
                <span key="1">
                  THE <span className="serif">story</span>
                </span>,
              ]}
            />
            <p className="page-head__sub">
              Bangkok กรุงเทพฯ raised. Manchester trained. Founder shaped.
            </p>
          </div>
        </section>

        <section className="section-ed--tight section-ed">
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
                    <div className="portrait__stand">
                      <PixelMicky height={96} />
                    </div>
                    <span className="portrait__note">portrait incoming</span>
                  </div>
                  <figcaption>{profile.name} · บารมี ธนวโรธร</figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        <Marquee outline items={["NUMBERS", "ตัวเลข", "NUMBERS", "ตัวเลข"]} duration={24} />

        <section className="section-ed--tight section-ed">
          <div className="shell">
            <div className="sec-label label">Facts</div>
            <div className="facts">
              {facts.map((f, i) => (
                <Reveal key={i} delay={i * 0.05} className="fact">
                  <span className="fact__n">{f.n}</span>
                  <span className="fact__k">{f.k}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-ed--tight section-ed">
          <div className="shell">
            <div className="sec-label label">Timeline</div>
            <div className="timeline">
              {timeline.map((t) => (
                <Reveal key={t.year} className="timeline__row">
                  <span className="timeline__year serif">{t.year}</span>
                  <span className="timeline__what">{t.what}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
