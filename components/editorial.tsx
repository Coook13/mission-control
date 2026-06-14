import Link from "next/link";
import { nav, profile, workIndex } from "@/lib/site-data";
import { Lines, ParallaxImg, Reveal } from "./motion";
import { Marquee } from "./Marquee";
import { PixelMicky } from "./PixelMicky";
import { HoverIndex } from "./HoverIndex";

export function Header() {
  return (
    <header className="header">
      <Link href="/" className="logotype">
        Micky<span className="logotype__reg">®</span>
      </Link>
      <nav>
        {nav.map((n) => (
          <Link key={n.href} href={n.href}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

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
        <div className="sec-label label">01 / My story</div>
        <div className="story">
          <div>
            <Lines
              as="h2"
              className="story__head"
              lines={[
                <span key="1">ENGINEER BY TRAINING,</span>,
                <span key="2" className="serif">
                  founder by habit.
                </span>,
              ]}
            />
            <Reveal className="story__body">
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
              <figcaption>Learn by shipping</figcaption>
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
        <div className="sec-label label">02 / Selected work</div>
        <Reveal>
          <HoverIndex rows={workIndex} />
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/work" className="textlink" style={{ marginTop: "28px", display: "inline-block" }}>
            All work
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="contact-ed" id="contact">
      <div className="contact-ed__media">
        <ParallaxImg src="/img/contact.jpg" alt="A figure standing before a huge moon" strength={28} />
      </div>
      <div className="contact-ed__overlay">
        <Lines
          as="h2"
          className="contact-ed__lead"
          lines={[
            <span key="1">LET&apos;S BUILD</span>,
            <span key="2">
              SOMETHING THAT <span className="serif">works</span>.
            </span>,
          ]}
        />
        <div className="contact-ed__links">
          <a href={`mailto:${profile.email}`} data-hover>
            {profile.email}
          </a>
          <a href={profile.linkedin.href} target="_blank" rel="noopener" data-hover>
            LinkedIn / {profile.linkedin.label}
          </a>
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
        <span className="egg" title="type it anywhere">
          psst: type &quot;war&quot;
        </span>
      </footer>
    </>
  );
}
