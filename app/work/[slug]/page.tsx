import { existsSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { projects } from "@/lib/site-data";
import { Footer, Header } from "@/components/editorial";
import { ParallaxImg } from "@/components/motion";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  return { title: p ? p.title : "Work" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  const i = projects.findIndex((x) => x.slug === slug);
  const next = projects[(i + 1) % projects.length];

  // The 6 slugged projects ship a real photo at public/img/work/<slug>.jpg.
  // Resolve at build/request time: if the file is absent, render a tasteful
  // procedural monochrome hero instead of a broken <img>. Seed varies the
  // fallback look per project.
  const heroSrc = `/img/work/${p.slug}.jpg`;
  const hasHero = existsSync(join(process.cwd(), "public", "img", "work", `${p.slug}.jpg`));
  const seed = (i % 4) as 0 | 1 | 2 | 3;

  return (
    <div className="page-dark">
      <SpaceBackdrop />
      <Header />
      <main className="detail">
        <Link href="/work" className="detail__back" data-hover>
          Back to work
        </Link>

        <span className="detail__kicker">
          {String(i + 1).padStart(2, "0")} / {p.kicker}
        </span>
        <h1 className="detail__title">{p.title}</h1>

        <div className="detail__hero">
          {hasHero ? (
            <ParallaxImg src={heroSrc} alt={p.title} strength={46} />
          ) : (
            <div className="work-fallback work-fallback--hero" data-seed={seed} aria-hidden="true">
              <span className="work-fallback__mark">✦</span>
            </div>
          )}
        </div>

        <div className="detail__grid">
          <div className="detail__body">
            {p.summary.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
            <div className="tags">
              {p.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="detail__meta">
            <div className="row">
              <span>Role</span>
              <span>{p.meta.role}</span>
            </div>
            <div className="row">
              <span>Period</span>
              <span>{p.meta.period}</span>
            </div>
            <div className="row">
              <span>Place</span>
              <span>{p.meta.place}</span>
            </div>
            <div className="row">
              <span>Outcome</span>
              <span>{p.meta.outcome}</span>
            </div>
          </div>
        </div>

        <Link href={`/work/${next.slug}`} className="detail__next" data-hover>
          <span className="label">Next project</span>
          <span className="detail__next-title">{next.title} →</span>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
