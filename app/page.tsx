import {
  ContactSection,
  Footer,
  Header,
  RolesMarquee,
  StoryTeaser,
  WorkIndexSection,
} from "@/components/editorial";
import { HeroScene } from "@/components/HeroScene";
import { EasterEgg } from "@/components/EasterEgg";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroScene />
        <div className="page-body">
          <StoryTeaser />
          <RolesMarquee />
          <WorkIndexSection />
          <ContactSection />
        </div>
      </main>
      <Footer />
      <EasterEgg />
    </>
  );
}
