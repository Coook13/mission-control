"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Mail, RefreshCw, X } from "lucide-react";
import { faceOrder, faces, profile, type FaceId } from "@/lib/site-data";
import { CubeFallback } from "./CubeScene";

const CubeStage = dynamic(() => import("./CubeScene").then((module) => module.CubeStage), {
  ssr: false,
  loading: () => <CubeFallback onSelectFace={() => undefined} />,
});

type CubePortfolioProps = { initialFace: FaceId | null };

function replaceFaceQuery(face: FaceId | null) {
  const next = face ? `/?face=${face}` : "/";
  window.history.replaceState(window.history.state, "", next);
}

export function CubePortfolio({ initialFace }: CubePortfolioProps) {
  const [selectedFace, setSelectedFace] = useState<FaceId | null>(initialFace);
  const [previewFace, setPreviewFace] = useState<FaceId | null>(null);
  const [scrambled, setScrambled] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const activeContent = selectedFace ? faces[selectedFace] : null;

  const selectFace = useCallback((face: FaceId) => {
    setSelectedFace(face);
    setPreviewFace(face);
    replaceFaceQuery(face);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedFace(null);
    setPreviewFace(null);
    replaceFaceQuery(null);
  }, []);

  const resetCube = useCallback(() => {
    setSelectedFace(null);
    setPreviewFace(null);
    setScrambled(false);
    setResetSignal((value) => value + 1);
    replaceFaceQuery(null);
  }, []);

  const moveKeyboardFace = useCallback((direction: -1 | 1) => {
    const current = previewFace ?? selectedFace ?? "engineering";
    const index = faceOrder.indexOf(current);
    const next = faceOrder[(index + direction + faceOrder.length) % faceOrder.length];
    setPreviewFace(next);
    setSelectedFace(null);
    replaceFaceQuery(null);
  }, [previewFace, selectedFace]);

  const keyboardDescription = useMemo(
    () => "Use arrow keys to rotate between faces, Enter to open the focused face, R to reset, and Escape to close a panel.",
    [],
  );

  return (
    <main className={`cube-home${selectedFace ? " cube-home--selected" : ""}`}>
      <header className="cube-header">
        <div className="cube-identity">
          <h1>{profile.name}</h1>
          <p>{profile.thesis}</p>
        </div>
        <nav className="cube-utilities" aria-label="Quick links">
          <a href={profile.cv} target="_blank" rel="noopener noreferrer">
            CV <ExternalLink aria-hidden="true" />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn <ExternalLink aria-hidden="true" />
          </a>
          <a className="cube-icon-link" href={`mailto:${profile.email}`} aria-label={`Email ${profile.name}`} title="Email">
            <Mail aria-hidden="true" />
          </a>
        </nav>
      </header>

      <section
        className="cube-stage-shell"
        tabIndex={0}
        role="application"
        aria-label="Interactive Rubik's cube portfolio"
        aria-describedby="cube-keyboard-description"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            moveKeyboardFace(1);
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            moveKeyboardFace(-1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            selectFace(previewFace ?? selectedFace ?? "engineering");
          } else if (event.key.toLowerCase() === "r") {
            event.preventDefault();
            resetCube();
          } else if (event.key === "Escape") {
            closePanel();
          }
        }}
      >
        <span id="cube-keyboard-description" className="sr-only">{keyboardDescription}</span>
        <CubeStage
          selectedFace={selectedFace}
          previewFace={previewFace}
          resetSignal={resetSignal}
          onSelectFace={selectFace}
          onScrambleChange={setScrambled}
        />
      </section>

      {scrambled && (
        <button className="cube-reset" type="button" onClick={resetCube} aria-label="Reset cube" title="Reset cube">
          <RefreshCw aria-hidden="true" />
        </button>
      )}

      <div className="cube-face-access" aria-label="Portfolio sections">
        {faceOrder.map((faceId) => (
          <button key={faceId} type="button" onClick={() => selectFace(faceId)}>
            Open {faces[faceId].label}
          </button>
        ))}
      </div>

      <aside
        className={`proof-panel${activeContent ? " proof-panel--open" : ""}`}
        aria-hidden={!activeContent}
        style={{ "--face-color": activeContent?.color ?? "#121212" } as React.CSSProperties}
      >
        {activeContent && (
          <div className="proof-panel__inner">
            <div className="proof-panel__topline">
              <span className="proof-panel__code">{activeContent.code}</span>
              <button type="button" onClick={closePanel} aria-label="Close proof panel" title="Close">
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="proof-panel__heading">
              <span className="proof-panel__swatch" aria-hidden="true" />
              <h2>{activeContent.label}</h2>
            </div>
            <p className="proof-panel__thesis">{activeContent.thesis}</p>
            <div className="proof-list">
              {activeContent.proofs.map((proof) => {
                const content = (
                  <>
                    <span>{proof.label}</span>
                    <strong>{proof.result}</strong>
                  </>
                );
                return proof.href ? (
                  <Link key={proof.label} href={proof.href} className="proof-row proof-row--link">
                    {content}<span aria-hidden="true">&#8599;</span>
                  </Link>
                ) : (
                  <div key={proof.label} className="proof-row">{content}</div>
                );
              })}
            </div>
            <a
              className="proof-panel__action"
              href={activeContent.action.href}
              target={activeContent.action.external ? "_blank" : undefined}
              rel={activeContent.action.external ? "noopener noreferrer" : undefined}
            >
              {activeContent.action.label}<span aria-hidden="true">&#8599;</span>
            </a>
          </div>
        )}
      </aside>
    </main>
  );
}
