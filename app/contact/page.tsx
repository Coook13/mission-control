import type { Metadata } from "next";
import { ContactSection, Footer, Header } from "@/components/editorial";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";

export const metadata: Metadata = { title: "Contact" };

/* CONTACT — its own short, dedicated dark route (was the tail of /story).
   Reuses the deep-space register of the other sub-pages: the cheap fixed
   SpaceBackdrop behind, Header on top, the canonical ContactSection (the
   "LET'S BUILD SOMETHING THAT works" lead + Email + LinkedIn from site-data),
   then the Footer. Deliberately the shortest page in the set — one screen of
   intent, no scroll-length padding. ContactSection carries id="contact" so any
   /contact#contact / finale-CTA deep-link still resolves. */
export default function ContactPage() {
  return (
    <div className="page-dark page-dark--contact">
      <SpaceBackdrop />
      <Header />
      <main className="contact-main">
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
