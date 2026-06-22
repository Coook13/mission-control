import { Header } from "@/components/editorial";
import { Flythrough } from "@/components/space/Flythrough";
import { ScrollProgress } from "@/components/ScrollProgress";
import { EasterEgg } from "@/components/EasterEgg";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Flythrough />
      </main>
      <ScrollProgress />
      <EasterEgg />
    </>
  );
}
