import type { Metadata } from "next";
import { workIndex } from "@/lib/site-data";
import { Footer, Header } from "@/components/editorial";
import { Lines, Reveal } from "@/components/motion";
import { HoverIndex } from "@/components/HoverIndex";

export const metadata: Metadata = { title: "Work | Micky Thanawarothon" };

export default function WorkPage() {
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
                  ALL <span className="serif">work</span>
                </span>,
              ]}
            />
            <p className="page-head__sub">
              Ventures, research, hackathons, and strategy. Ten entries, six open.
            </p>
          </div>
        </section>
        <section className="section-ed--tight section-ed">
          <div className="shell">
            <Reveal>
              <HoverIndex rows={workIndex} split={false} />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
