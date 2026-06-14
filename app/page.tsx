import {
  ContactSection,
  Footer,
  Header,
  HeroEditorial,
  RolesMarquee,
  StoryTeaser,
  WorkIndexSection,
} from "@/components/editorial";
import { EasterEgg } from "@/components/EasterEgg";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroEditorial />
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
