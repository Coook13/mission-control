import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>This face does not exist.</h1>
      <Link href="/"><ArrowLeft aria-hidden="true" /> Return to the cube</Link>
    </main>
  );
}
