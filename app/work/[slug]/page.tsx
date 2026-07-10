import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { profile, projects } from "@/lib/site-data";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  return {
    title: project?.title ?? "Work",
    description: project?.oneLine,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const next = projects[(projectIndex + 1) % projects.length];
  const imageSrc = `/img/work/${project.slug}.jpg`;
  const hasImage = existsSync(join(process.cwd(), "public", "img", "work", `${project.slug}.jpg`));

  return (
    <main className="case-page">
      <header className="case-header">
        <Link href={`/?face=${project.faceId}`} className="case-back">
          <ArrowLeft aria-hidden="true" /> Back to {project.faceId}
        </Link>
        <nav aria-label="Quick links">
          <a href={profile.cv} target="_blank" rel="noopener noreferrer">CV</a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={`mailto:${profile.email}`}>Email</a>
        </nav>
      </header>

      <article className="case-article">
        <div className="case-intro">
          <span className="case-kicker">{String(projectIndex + 1).padStart(2, "0")} / {project.kicker}</span>
          <h1>{project.title}</h1>
          <p>{project.oneLine}</p>
        </div>

        <div className={`case-hero${hasImage ? "" : " case-hero--fallback"}`}>
          {hasImage ? (
            <Image src={imageSrc} alt={project.title} fill priority sizes="(max-width: 800px) 100vw, 88vw" />
          ) : (
            <span>{project.title}</span>
          )}
        </div>

        <div className="case-body">
          {[
            ["Problem", project.problem],
            ["Action", project.action],
            ["Result", project.result],
          ].map(([label, copy]) => (
            <section key={label}>
              <h2>{label}</h2>
              <p>{copy}</p>
            </section>
          ))}
          <aside className="case-meta" aria-label="Project details">
            {Object.entries(project.meta).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </aside>
          <div className="case-tags" aria-label="Project tags">
            {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>

        <Link href={`/work/${next.slug}`} className="case-next">
          <span>Next case study</span>
          <strong>{next.title}<ArrowUpRight aria-hidden="true" /></strong>
        </Link>
      </article>
    </main>
  );
}
