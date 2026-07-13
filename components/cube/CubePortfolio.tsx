"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ExternalLink, List, Mail, RefreshCw, Shuffle, X } from "lucide-react";
import { faceOrder, faces, profile, type FaceId } from "@/lib/site-data";
import type { FaceFocusRequest } from "./CubeScene";

const CubeStage = dynamic(() => import("./CubeScene").then((module) => module.CubeStage), {
  ssr: false,
  loading: () => null,
});

type CubePortfolioProps = { initialFace: FaceId | null };

const mobileQuery = "(max-width: 700px)";
const portfolioIndexOrder: readonly FaceId[] = [
  "story",
  "engineering",
  "venture",
  "strategy",
  "finance",
  "research",
];

function subscribeMobile(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

function replaceFaceQuery(face: FaceId | null) {
  const next = face ? `/?face=${face}` : "/";
  window.history.replaceState(window.history.state, "", next);
}

export function CubePortfolio({ initialFace }: CubePortfolioProps) {
  const [selectedFace, setSelectedFace] = useState<FaceId | null>(initialFace);
  const [previewFace, setPreviewFace] = useState<FaceId | null>(null);
  const [scrambled, setScrambled] = useState(false);
  const [scrambleSignal, setScrambleSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [focusRequest, setFocusRequest] = useState<FaceFocusRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, () => false);
  const [playIntro, setPlayIntro] = useState(false);
  const [spinHintVisible, setSpinHintVisible] = useState(false);
  const [cubeReady, setCubeReady] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const activeContent = selectedFace ? faces[selectedFace] : null;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldPlayIntro = window.sessionStorage.getItem("cube-intro-played") !== "true";
      const shouldShowHint = window.sessionStorage.getItem("cube-spin-hint-dismissed") !== "true";
      setPlayIntro(shouldPlayIntro);
      setSpinHintVisible(shouldShowHint);
      if (shouldPlayIntro) window.sessionStorage.setItem("cube-intro-played", "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mobile || !drawerOpen) return;
    const drawer = drawerRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const drawerToggle = drawerToggleRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>("button, a[href]");
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      (previousFocus ?? drawerToggle)?.focus();
    };
  }, [drawerOpen, mobile]);

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
    setZoom(1);
    setResetSignal((value) => value + 1);
    replaceFaceQuery(null);
  }, []);

  const scrambleCube = useCallback(() => {
    setScrambled(true);
    setScrambleSignal((value) => value + 1);
  }, []);

  const openIndexedFace = useCallback((face: FaceId) => {
    setFocusRequest((current) => ({ faceId: face, requestId: (current?.requestId ?? 0) + 1 }));
    selectFace(face);
    setDrawerOpen(false);
  }, [selectFace]);

  const dismissSpinHint = useCallback(() => {
    setSpinHintVisible(false);
    window.sessionStorage.setItem("cube-spin-hint-dismissed", "true");
  }, []);

  const markCubeReady = useCallback(() => {
    setCubeReady(true);
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
    () => "Use arrow keys to rotate between faces, Enter to open the focused face, plus and minus to zoom, R to reset, and Escape to close a panel.",
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

      <div
        className={`cube-boot${cubeReady ? " cube-boot--ready" : ""}`}
        role="status"
        aria-label={cubeReady ? undefined : "Loading interactive portfolio cube"}
        aria-hidden={cubeReady}
      >
        <div className="cube-boot__mark">
          <span>Micky Thanawarothon</span>
          <i aria-hidden="true" />
        </div>
      </div>

      <section
        className="cube-stage-shell"
        tabIndex={0}
        role="application"
        aria-label="Interactive Rubik's cube portfolio"
        aria-describedby="cube-keyboard-description"
        onWheel={(event) => {
          const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
          const delta = event.deltaY * multiplier;
          setZoom((current) => Math.min(1.35, Math.max(0.72, current * Math.exp(-delta * 0.0012))));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            moveKeyboardFace(1);
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            moveKeyboardFace(-1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            openIndexedFace(previewFace ?? selectedFace ?? "engineering");
          } else if (event.key.toLowerCase() === "r") {
            event.preventDefault();
            resetCube();
          } else if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            setZoom((current) => Math.min(1.35, current + 0.1));
          } else if (event.key === "-" || event.key === "_") {
            event.preventDefault();
            setZoom((current) => Math.max(0.72, current - 0.1));
          } else if (event.key === "Escape") {
            closePanel();
          }
        }}
      >
        <span id="cube-keyboard-description" className="sr-only">{keyboardDescription}</span>
        <CubeStage
          selectedFace={selectedFace}
          previewFace={previewFace}
          zoom={zoom}
          focusRequest={focusRequest}
          playIntro={playIntro}
          scrambleSignal={scrambleSignal}
          resetSignal={resetSignal}
          onSelectFace={selectFace}
          onScrambleChange={setScrambled}
          onOrbitStart={dismissSpinHint}
          onFirstFrame={markCubeReady}
        />
      </section>

      <button
        ref={drawerToggleRef}
        className="section-index-toggle"
        type="button"
        aria-expanded={drawerOpen}
        aria-controls="portfolio-index"
        onClick={() => setDrawerOpen(true)}
      >
        <List aria-hidden="true" />
        <span>Index</span>
        <small>6 sections</small>
      </button>

      <button
        className={`section-index-backdrop${drawerOpen ? " is-open" : ""}`}
        type="button"
        aria-label="Close portfolio index"
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        ref={drawerRef}
        id="portfolio-index"
        className={`section-index${drawerOpen ? " is-open" : ""}`}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label="Portfolio index"
        aria-hidden={mobile && !drawerOpen}
        inert={mobile && !drawerOpen}
      >
        <div className="section-index__header">
          <div>
            <span>Portfolio / Index</span>
            <small>Six working lenses</small>
          </div>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close portfolio index" title="Close">
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Portfolio sections">
          {portfolioIndexOrder.map((faceId, index) => (
            <button
              key={faceId}
              type="button"
              aria-current={selectedFace === faceId ? "page" : undefined}
              style={{ "--face-color": faces[faceId].color } as React.CSSProperties}
              onClick={() => openIndexedFace(faceId)}
            >
              <span className="section-index__number">{String(index + 1).padStart(2, "0")}</span>
              <span className="section-index__copy">
                <strong>{faces[faceId].label}</strong>
                <small>{faces[faceId].navDescription}</small>
              </span>
              <span className="section-index__marker" aria-hidden="true" />
            </button>
          ))}
        </nav>
      </aside>

      <div className="cube-controls" aria-label="Cube controls">
        <button className="cube-control-icon" type="button" onClick={scrambleCube} aria-label="Scramble cube" title="Scramble cube">
          <Shuffle aria-hidden="true" />
        </button>
        {scrambled && (
          <button className="cube-control-icon" type="button" onClick={resetCube} aria-label="Reset cube" title="Reset cube">
            <RefreshCw aria-hidden="true" />
          </button>
        )}
      </div>

      <p
        className={`spin-hint${spinHintVisible ? " is-visible" : ""}`}
        aria-hidden="true"
        suppressHydrationWarning
      >
        <span>Spin it</span>
        <small>Tap a tile, then swipe to twist</small>
      </p>

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
