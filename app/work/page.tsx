import type { Metadata } from "next";
import { workIndex } from "@/lib/site-data";
import { Footer, Header } from "@/components/editorial";
import { WordReveal } from "@/components/motion";
import { HoverIndex } from "@/components/HoverIndex";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";

export const metadata: Metadata = { title: "Work | Micky Thanawarothon" };

export default function WorkPage() {
  return (
    <div className="page-dark">
      <SpaceBackdrop />
      <Header />
      <main>
        <section className="page-head">
          <div className="shell">
            <WordReveal
              as="h1"
              className="page-head__title"
              delay={0.15}
              speed={1.22}
              words={[{ t: "ALL" }, { t: "work", serif: true }]}
            />
            <p className="page-head__sub" data-speed={0.9}>
              Ventures, research, hackathons, and strategy. Ten entries, six open.
            </p>
          </div>
        </section>
        <section className="section-ed--tight section-ed">
          <div className="shell">
            <HoverIndex rows={workIndex} split={false} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
