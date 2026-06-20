import { Header } from "@/components/editorial";
import { Flythrough } from "@/components/space/Flythrough";
import { EasterEgg } from "@/components/EasterEgg";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Flythrough />
      </main>
      <EasterEgg />
    </>
  );
}
