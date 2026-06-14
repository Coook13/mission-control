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
        <StoryTeaser />
        <RolesMarquee />
        <WorkIndexSection />
        <ContactSection />
      </main>
      <Footer />
      <EasterEgg />
    </>
  );
}
