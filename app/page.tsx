import { CubePortfolio } from "@/components/cube/CubePortfolio";
import { parseFaceQuery } from "@/lib/site-data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ face?: string | string[] }>;
}) {
  const { face } = await searchParams;
  return <CubePortfolio initialFace={parseFaceQuery(face)} />;
}
