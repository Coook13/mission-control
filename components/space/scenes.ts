/* The cinematic journey, built on REAL imagery. Each beat is a real planet
   photo presented as a large object over the moving starfield, graded to the
   locked "deep cinematic" look. `peak` is the scroll-progress (0..1) the beat
   centres on; the label sits on `side` (opposite the planet). Hotspots are bold
   glowing markers over the planet that open an in-scene panel linking to work
   (mapped from lib/site-data.ts). */
export type Hotspot = {
  title: string;
  oneLine: string;
  href: string;
  x: number; // % across the viewport
  y: number; // % down the viewport
};

export type Scene = {
  key: string;
  idx: string;
  label: string;
  desc: string;
  proofLine: string;
  img: string;
  peak: number;
  side: "left" | "right";
  tint: string; // faint galaxy tint for this beat
  scale: number; // base display size of the planet object (vh)
  hotspots: Hotspot[];
  /* OPTIONAL beat-slot photo. When set, FlowPanels renders a next/image (fill,
     object-cover) inside the .flowpanel__slot instead of the procedural
     star-wash empty state. Drop a path here (e.g. "/img/beats/trading.jpg") to
     fill a single beat — leave undefined to keep the accepted empty look. */
  slotImg?: string;
  /* OPTIONAL object-position for slotImg (these are tall phone photos dropped
     into a wide 16/7 slot, so the default center-crop can cut the subject).
     e.g. "50% 30%". Defaults to "center". */
  slotPos?: string;
};

export const HERO_IMG = "/img/space/cine-deepfield.jpg";

export const SCENES: Scene[] = [
  {
    key: "engineering", idx: "01", label: "Engineering", desc: "AI · CFD · computer vision · robotics",
    img: "/img/space/cine-mars.webp", peak: 0.22, side: "left", tint: "#7a3f5e", scale: 86,
    proofLine: "technical proof",
    slotImg: "/img/beats/engineering.jpg",
    hotspots: [
      { title: "AirfoilLearner", oneLine: "AI for CFD optimisation · raised £5k", href: "/work/airfoillearner", x: 60, y: 40 },
      { title: "Solar Inspection", oneLine: "Computer vision · 97.2% accuracy", href: "/work/solar-cv", x: 52, y: 58 },
      { title: "AccelerateMe", oneLine: "ARM robotics · 2nd place", href: "/work/accelerateme-arm", x: 46, y: 30 },
    ],
  },
  {
    key: "trading", idx: "02", label: "Trading", desc: "Systematic FX & quant strategies",
    img: "/img/space/cine-jupiter.webp", peak: 0.38, side: "right", tint: "#8a6a3a", scale: 92,
    proofLine: "market discipline",
    slotImg: "/img/beats/trading.jpg",
    hotspots: [
      { title: "Systematic trading", oneLine: "FX & quant strategies — let's talk", href: "/contact", x: 44, y: 46 },
    ],
  },
  {
    key: "venture", idx: "03", label: "Venture", desc: "Founder — ventures built & shipped",
    img: "/img/space/cine-saturn.webp", peak: 0.54, side: "left", tint: "#6a5a2a", scale: 96,
    proofLine: "shipping proof",
    slotImg: "/img/beats/venture.jpg",
    hotspots: [
      { title: "AirfoilLearner", oneLine: "Founded · raised £5k via Venture Builder", href: "/work/airfoillearner", x: 58, y: 42 },
      { title: "CreamCat Gelato", oneLine: "70% gross-margin venture", href: "/work/creamcat-gelato", x: 50, y: 56 },
    ],
  },
  {
    key: "strategy", idx: "04", label: "Strategy", desc: "Growth, go-to-market, positioning",
    img: "/img/space/cine-neptune.webp", peak: 0.70, side: "right", tint: "#2a4a8a", scale: 82,
    proofLine: "commercial judgment",
    slotImg: "/img/beats/strategy.jpg",
    hotspots: [
      { title: "Deliveroo Case", oneLine: "EMEA summit runner-up · unit economics", href: "/work/deliveroo-case", x: 46, y: 46 },
    ],
  },
  {
    key: "research", idx: "05", label: "Research", desc: "NECTEC graphene · ISSDC NASA finalist",
    img: "/img/space/cine-earth.webp", peak: 0.85, side: "left", tint: "#2a5a7a", scale: 88,
    proofLine: "deep-tech credibility",
    slotImg: "/img/beats/research.jpg",
    hotspots: [
      { title: "NECTEC", oneLine: "Graphene quantum-dot sensor R&D", href: "/work/nectec-research", x: 58, y: 48 },
    ],
  },
];
