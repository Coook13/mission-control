"use client";

import Link from "next/link";
import { useEffect } from "react";
import { profile, workIndex } from "@/lib/site-data";
import { Lines, ParallaxImg, Reveal, WordReveal } from "./motion";
import { Marquee } from "./Marquee";
import { PixelMicky } from "./PixelMicky";
import { HoverIndex } from "./HoverIndex";
import { Magnetic } from "./Magnetic";
import { SecLabel } from "./SecLabel";

export { Header } from "./Header";

export function HeroEditorial() {
  return (
    <section className="hero-ed">
      <div className="hero-ed__name">
        <Lines
          as="h1"
          className="wordmark"
          delay={1.0}
          lines={[
            <span key="1">
              MIC<span className="serif">k</span>Y
            </span>,
            <span key="2" className="wordmark__last">
              THANAWAROTHON<span className="wordmark__reg">©</span>
            </span>,
          ]}
        />
        <div className="hero-ed__strap">
          <Lines
            as="p"
            className="hero-ed__tag"
            delay={1.35}
            lines={[
              <span key="1">
                I build things that <span className="serif">work</span>.
              </span>,
              <span key="2">With the right strategy.</span>,
            ]}
          />
          <div className="hero-ed__roles">
            {profile.roles.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-ed__media">
        <ParallaxImg src="/img/hero.jpg" alt="Astronaut floating above a bright field" strength={70} />
        <div className="hero-ed__walker">
          <PixelMicky height={58} />
        </div>
      </div>
      <div className="hero-ed__caption">
        <span>Baramee Thanawarothon · บารมี</span>
        <span>EST. Bangkok กรุงเทพฯ — OPS. Manchester</span>
      </div>
    </section>
  );
}

export function StoryTeaser() {
  return (
    <section className="section-ed" id="story">
      <div className="shell">
        <SecLabel speed={1.2}>01 / My story</SecLabel>
        <div className="story">
          <div>
            <WordReveal
              as="h2"
              className="story__head"
              speed={1.12}
              words={[
                { t: "ENGINEER" }, { t: "BY" }, { t: "TRAINING," }, { br: true },
                { t: "founder", serif: true }, { t: "by", serif: true }, { t: "habit.", serif: true },
              ]}
            />
            <Reveal className="story__body" delay={0.1}>
              {profile.story.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <Link href="/story" className="textlink">
                Read the story
              </Link>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <figure className="story__media">
              <ParallaxImg src="/img/story.jpg" alt="Astronaut leaping through the air" strength={36} />
              <figcaption data-speed={0.9}>Learn by shipping</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function RolesMarquee() {
  return (
    <Marquee
      outline
      items={["FOUNDER", "ENGINEER", "STRATEGIST", "BUILDER", "กรุงเทพฯ → MANCHESTER"]}
    />
  );
}

export function WorkIndexSection() {
  return (
    <section className="section-ed section-ed--tight" id="work">
      <div className="shell">
        <SecLabel speed={1.2}>02 / Selected work</SecLabel>
        <HoverIndex rows={workIndex} />
        <Reveal delay={0.1}>
          <Link href="/work" className="textlink" style={{ marginTop: "28px", display: "inline-block" }}>
            All work
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* Resolves the #contact deep-link. Both the nav "CONTACT" item (site-data:
   "/#contact") and the flythrough finale CTA ("/#contact") point at the home
   route + #contact hash, but the contact block only lives where ContactSection
   mounts — so on landing with a #contact hash we smooth-scroll to it (the
   native jump is unreliable behind the fixed header + Lenis). */
function useContactAnchor() {
  useEffect(() => {
    const scrollToContact = () => {
      if (window.location.hash !== "#contact") return;
      const el = document.getElementById("contact");
      if (!el) return;
      // rAF so layout/Lenis are settled before we scroll
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    };
    scrollToContact();
    window.addEventListener("hashchange", scrollToContact);
    return () => window.removeEventListener("hashchange", scrollToContact);
  }, []);
}

/* CONTACT — the canonical #contact target. Re-skinned to the deep-space
   register: pure black, white type, one cool accent. No photo (the old
   /img/contact.jpg ran warm and broke the monochrome). The whole block is
   the anchor the nav "CONTACT" link and the flythrough finale CTA resolve to,
   so it carries scroll-margin to clear the fixed header. */
export function ContactSection() {
  useContactAnchor();
  return (
    <section className="contact-ed" id="contact">
      <div className="contact-ed__warp" aria-hidden="true" />
      <div className="shell contact-ed__inner">
        <SecLabel speed={1.2}>Contact</SecLabel>
        <WordReveal
          as="h2"
          className="contact-ed__lead"
          speed={1.12}
          words={[
            { t: "LET’S" }, { t: "BUILD" }, { br: true },
            { t: "SOMETHING" }, { t: "THAT" }, { t: "works.", serif: true },
          ]}
        />
        <div className="contact-ed__links" data-speed={0.92}>
          <Magnetic strength={0.4}>
            <a href={`mailto:${profile.email}`} data-hover>
              <span className="contact-ed__kind">Email</span>
              <span className="contact-ed__val">{profile.email}</span>
            </a>
          </Magnetic>
          <Magnetic strength={0.4}>
            <a href={profile.linkedin.href} target="_blank" rel="noopener noreferrer" data-hover>
              <span className="contact-ed__kind">LinkedIn</span>
              <span className="contact-ed__val">{profile.linkedin.label}</span>
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <>
      <Marquee items={["LET'S BUILD SOMETHING THAT WORKS", "พร้อมลุย"]} duration={20} />
      <footer className="footer-ed">
        <span>{profile.name} © 2026</span>
        <span>Manchester / Bangkok</span>
        <span className="footer-ed__credit">
          Rocket: “Rocket ship” by{" "}
          <a href="https://poly.pizza/m/4mPkOKdzAk-" target="_blank" rel="noopener noreferrer">Poly by Google</a>,{" "}
          <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>
        </span>
        <span className="egg" title="type it anywhere">
          psst: type &quot;war&quot;
        </span>
      </footer>
    </>
  );
}
