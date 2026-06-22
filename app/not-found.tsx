import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/editorial";
import { Reveal, WordReveal } from "@/components/motion";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";

export const metadata: Metadata = { title: "Lost in space | Micky Thanawarothon" };

/* 404 — themed for the deep-space register. Reuses the cheap fixed SpaceBackdrop
   (no WebGL), the Header, and the Footer, exactly like the /story and /contact
   sub-pages. White grotesque "LOST IN / SPACE" over the void, the 404 marker,
   and a single link home. Static + light. */
export default function NotFound() {
  return (
    <div className="page-dark page-dark--notfound">
      <SpaceBackdrop />
      <Header />
      <main>
        <section className="page-head notfound">
          <div className="shell">
            <span className="notfound__code" aria-hidden="true">
              404
            </span>
            <WordReveal
              as="h1"
              className="page-head__title"
              delay={0.12}
              speed={1.2}
              words={[{ t: "LOST IN" }, { br: true }, { t: "space", serif: true }]}
            />
            <Reveal delay={0.18}>
              <p className="page-head__sub notfound__sub">
                This signal drifted past the event horizon. Nothing to find here.
              </p>
              <Link href="/" className="textlink notfound__link">
                Back to the start
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
