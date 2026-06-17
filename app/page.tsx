import {
  ContactSection,
  Footer,
  Header,
  RolesMarquee,
  StoryTeaser,
  WorkIndexSection,
} from "@/components/editorial";
import { Flythrough } from "@/components/space/Flythrough";
import { EasterEgg } from "@/components/EasterEgg";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Flythrough />
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
