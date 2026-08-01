export type FaceId =
  | "engineering"
  | "venture"
  | "strategy"
  | "finance"
  | "research"
  | "story";

export type FaceProof = {
  label: string;
  result: string;
  href?: string;
};

export type FaceContent = {
  id: FaceId;
  code: string;
  label: string;
  navDescription: string;
  color: string;
  thesis: string;
  proofs: readonly FaceProof[];
  action: { label: string; href: string; external?: boolean };
};

export type Project = {
  slug: string;
  faceId: FaceId;
  title: string;
  kicker: string;
  oneLine: string;
  problem: string;
  action: string;
  result: string;
  meta: { role: string; period: string; place: string; outcome: string };
  tags: string[];
};

export const profile = {
  name: "Micky Thanawarothon",
  fullName: "Baramee Thanawarothon",
  thesis: "Founder, strategist, investor, engineer.",
  email: "micky.thana@gmail.com",
  linkedin: "https://linkedin.com/in/baramee-thanawarothon/",
  cv: "/Baramee-Thanawarothon-CV.pdf",
} as const;

export const faceOrder: readonly FaceId[] = [
  "engineering",
  "venture",
  "strategy",
  "finance",
  "research",
  "story",
];

export const faces: Record<FaceId, FaceContent> = {
  engineering: {
    id: "engineering",
    code: "ENG",
    label: "Engineering",
    navDescription: "Systems & robotics",
    color: "#2457E6",
    thesis: "I build the thing myself.",
    proofs: [
      { label: "Solar inspection", result: "97.2% computer-vision accuracy", href: "/work/solar-cv" },
      { label: "AccelerateMe / ARM", result: "2nd place, inverse kinematics", href: "/work/accelerateme-arm" },
      { label: "AirfoilLearner", result: "AI for CFD optimisation", href: "/work/airfoillearner" },
    ],
    action: { label: "View technical work", href: "/work/solar-cv" },
  },
  venture: {
    id: "venture",
    code: "VEN",
    label: "Venture",
    navDescription: "Companies & growth",
    color: "#E4473A",
    thesis: "I started a company.",
    proofs: [
      { label: "AirfoilLearner", result: "Co-founded, \u00A38k Venture Builder", href: "/work/airfoillearner" },
      { label: "CreamCat Gelato", result: "Founded, gym-channel D2C", href: "/work/creamcat-gelato" },
    ],
    action: { label: "View AirfoilLearner", href: "/work/airfoillearner" },
  },
  strategy: {
    id: "strategy",
    code: "STR",
    label: "Strategy",
    navDescription: "Markets & execution",
    color: "#F2C94C",
    thesis: "I find the number that kills the idea.",
    proofs: [
      { label: "Deliveroo student plan", result: "EMEA strategy runner-up", href: "/work/deliveroo-case" },
      { label: "AirfoilLearner", result: "20+ engineer interviews", href: "/work/airfoillearner" },
      { label: "KMT Group", result: "Early consulting work, Thai SMEs", href: "/work/kmt-group" },
    ],
    action: { label: "Read the Deliveroo case", href: "/work/deliveroo-case" },
  },
  finance: {
    id: "finance",
    code: "FIN",
    label: "Finance",
    navDescription: "Capital & quantitative",
    color: "#2F9E5B",
    thesis: "I put real money behind my calls.",
    proofs: [
      { label: "Shade Tree Fund", result: "Won a \u00A35k investment allocation", href: "/work/shade-tree" },
      { label: "TK Partners", result: "Venture-capital intern, Bangkok", href: "/work/tk-partners" },
      { label: "Systematic trading", result: "FX and quantitative strategies", href: "/work/trading" },
    ],
    action: { label: "Discuss markets", href: `mailto:${profile.email}` },
  },
  research: {
    id: "research",
    code: "R&D",
    label: "Research",
    navDescription: "Sensors & materials",
    color: "#F28A2E",
    thesis: "I work on problems with no answer yet.",
    proofs: [
      { label: "NECTEC sensor", result: "Graphene quantum-dot R&D", href: "/work/nectec-research" },
      { label: "Supercapacitor", result: "~20% capacitance improvement", href: "/work/nectec-research" },
      { label: "ISSDC", result: "NASA global runner-up", href: "/work/issdc" },
    ],
    action: { label: "View NECTEC research", href: "/work/nectec-research" },
  },
  story: {
    id: "story",
    code: "MICKY",
    label: "Story",
    navDescription: "Background & CV",
    color: "#ECEDEF",
    thesis: "Raised in Bangkok, studying in Manchester.",
    proofs: [
      { label: "University of Manchester", result: "88% first-year average, predicted First", href: "/work/manchester" },
      { label: "Bangkok to Manchester", result: "Technical training with a commercial lens", href: "/work/bangkok-to-manchester" },
      { label: "Founder", result: "AirfoilLearner and CreamCat", href: "/work/founder" },
    ],
    action: { label: "Open CV", href: profile.cv, external: true },
  },
};

export const projects: Project[] = [
  {
    slug: "airfoillearner",
    faceId: "venture",
    title: "AirfoilLearner",
    kicker: "Venture / AI / CFD",
    oneLine: "AI that speeds up aerodynamic design.",
    problem: "Running a CFD optimisation loop is slow, expensive, and needs a specialist to drive it.",
    action: "To find out where the loop actually breaks, I interviewed 20+ engineers and students before we scoped the product.",
    result: "221% month-on-month user growth and an NPS of 35 on the market-fit report. Still in development.",
    meta: { role: "Co-Founder", period: "Sep 2025 to present", place: "Manchester, UK", outcome: "\u00A38k, Venture Builder" },
    tags: ["founder", "AI", "CFD"],
  },
  {
    slug: "deliveroo-case",
    faceId: "strategy",
    title: "Deliveroo Student Plan",
    kicker: "Strategy / Unit economics",
    oneLine: "A student subscription plan pitched to Deliveroo.",
    problem: "The plan had to win student subscribers without the economics falling apart underneath it.",
    action: "I modelled the unit economics on a \u00A32.49 monthly tier and designed the rollout from campus beta to Freshers.",
    result: "\u00A31.06 net margin per subscriber a month and a \u00A3780 four-year LTV against a \u00A310 student acquisition cost. We pitched it to Deliveroo executives and came runner-up out of 60+ teams.",
    meta: { role: "Runner-up", period: "Feb to Mar 2026", place: "London, UK", outcome: "2nd place" },
    tags: ["strategy", "unit economics", "go-to-market"],
  },
  {
    slug: "nectec-research",
    faceId: "research",
    title: "NECTEC R&D",
    kicker: "Research / Materials",
    oneLine: "Graphene sensor and supercapacitor work at Thailand's national lab.",
    problem: "The lab wanted a heavy-metal sensor and a working supercapacitor cell, both cheap enough to actually make.",
    action: "I synthesised graphene quantum dots from a plant leaf, then built the electrodes and electrolyte for the supercapacitor. I also ran Raman characterisation for the terahertz team.",
    result: "The sensor picked up heavy metals as fluorescence under UV. The cell measured around 20% higher capacitance, though it never reached production standard.",
    meta: { role: "Research Trainee", period: "Jul to Aug 2024", place: "Pathum Thani, Thailand", outcome: "Working sensor, ~20% capacitance gain" },
    tags: ["graphene", "sensors", "hardware"],
  },
  {
    slug: "solar-cv",
    faceId: "engineering",
    title: "Solar-Panel Inspection",
    kicker: "Engineering / Computer vision",
    oneLine: "A neural network that finds broken solar panels.",
    problem: "Thermal inspection on a solar farm is done by hand, panel by panel.",
    action: "I trained a convolutional neural network to find hotspots, then adapted it to read drone footage. I also prototyped an in-house language model that never went past a learning build.",
    result: "97.2% accuracy, and around 80% off the projected inspection time.",
    meta: { role: "ML Intern", period: "Sep 2023 to Jun 2024", place: "QuantGates, remote", outcome: "97.2% accuracy" },
    tags: ["computer vision", "energy", "modelling"],
  },
  {
    slug: "accelerateme-arm",
    faceId: "engineering",
    title: "AccelerateMe / ARM",
    kicker: "Engineering / Robotics",
    oneLine: "A robot arm built and working inside a hackathon deadline.",
    problem: "The arm had to move reliably by the end of the build window.",
    action: "I wrote the inverse kinematics and got it running inside the team prototype.",
    result: "It worked at judging and we came second.",
    meta: { role: "Robotics Engineer", period: "2025", place: "Manchester, UK", outcome: "2nd place" },
    tags: ["robotics", "inverse kinematics", "rapid build"],
  },
  {
    slug: "creamcat-gelato",
    faceId: "venture",
    title: "CreamCat Gelato",
    kicker: "Venture / Operations",
    oneLine: "A high-protein gelato brand sold through gyms instead of retail.",
    problem: "Retail freezer space in Bangkok takes a commission and needs capital up front.",
    action: "I built a P&L for three routes to market and picked the partner-led one into gyms.",
    result: "CreamCat sells out of gym freezers with no retail footprint behind it.",
    meta: { role: "Founder", period: "Jul to Nov 2025", place: "Bangkok, Thailand", outcome: "Gym-channel launch" },
    tags: ["founder", "operations", "go-to-market"],
  },
  {
    slug: "kmt-group",
    faceId: "strategy",
    title: "KMT Group",
    kicker: "Consulting / Thai SMEs",
    oneLine: "Consulting for Thai SMEs. Paused.",
    problem: "Thai SMEs and family businesses run on manual operations with almost no data behind the decisions.",
    action: "I scoped lead generation and operations work with one SME and one private school.",
    result: "This is something I am still working on rather than a registered company. Paused through 2026 while I build for hackathons.",
    meta: { role: "Founder (paused)", period: "2025 to 2026", place: "Thailand", outcome: "Paused, early-stage" },
    tags: ["consulting", "SME", "operations"],
  },
  {
    slug: "shade-tree",
    faceId: "finance",
    title: "Shade Tree Fund",
    kicker: "Finance / Investing",
    oneLine: "A 25-year buy case on Prysmian that won £5,000 to invest.",
    problem: "The question was whether Prysmian holds up as a 25-year hold on the electrification cycle.",
    action: "We ran a DCF, trading comps, a Monte Carlo, and a regression, then let the disagreement between them set the range. Terminal value is anchored to nominal GDP instead of an exit multiple.",
    result: "We landed at EUR 124.80 a share, 28.6% above market. I still track the position.",
    meta: { role: "Winner", period: "Feb to Mar 2026", place: "London, UK", outcome: "Won £5k allocation" },
    tags: ["investing", "valuation", "equities"],
  },
  {
    slug: "tk-partners",
    faceId: "finance",
    title: "TK Partners",
    kicker: "Venture Capital / Health-tech",
    oneLine: "Venture capital, early-stage health-tech, Bangkok.",
    problem: "Early-stage calls get made before the numbers are clean.",
    action: "I work on sourcing, diligence, and market research across early-stage health-tech in Southeast Asia.",
    result: "I took it as a warm route into strategy and investing work in the region.",
    meta: { role: "Business Analyst Intern", period: "Jul to Sep 2026", place: "Bangkok, Thailand", outcome: "In progress" },
    tags: ["venture capital", "health-tech", "diligence"],
  },
  {
    slug: "trading",
    faceId: "finance",
    title: "Systematic Trading",
    kicker: "Markets / Quant",
    oneLine: "Systematic trading with rules I can test.",
    problem: "I wanted rules I could test instead of judgement calls I could not.",
    action: "I build and test strategies on MT5 and size positions against a fixed risk limit.",
    result: "I traded a funded FTMO account at a 1.6 live Sharpe under a 10% drawdown cap. Nothing is deployed right now and the current work is backtest research. I keep this as a personal discipline rather than a headline.",
    meta: { role: "Self-directed", period: "2024 to present", place: "Remote", outcome: "Research stage" },
    tags: ["quant", "systematic", "risk"],
  },
  {
    slug: "issdc",
    faceId: "research",
    title: "ISSDC",
    kicker: "Research / Systems / NASA-sponsored",
    oneLine: "A lunar settlement designed in 48 hours.",
    problem: "A full lunar-settlement proposal, written and presented inside 48 hours.",
    action: "I led the 12-person business and marketing function inside a 60-person company, and built the electrical systems and the financial model.",
    result: "We presented at Kennedy Space Center and finished as global runner-up.",
    meta: { role: "Head of Business and Marketing", period: "Jul to Aug 2024", place: "Florida, USA", outcome: "Global runner-up" },
    tags: ["systems", "space", "leadership"],
  },
  {
    slug: "manchester",
    faceId: "story",
    title: "University of Manchester",
    kicker: "Education / EEE",
    oneLine: "Electrical and Electronic Engineering, on track for a First.",
    problem: "I picked engineering for the technical base, not for a hardware career.",
    action: "I study EEE and run ventures and case competitions next to it.",
    result: "88% average across the first year, on a predicted First. I came in with A* Maths and A* Chemistry.",
    meta: { role: "BEng EEE", period: "2025 to 2028", place: "Manchester, UK", outcome: "88%, predicted First" },
    tags: ["engineering", "education", "first-class"],
  },
  {
    slug: "bangkok-to-manchester",
    faceId: "story",
    title: "Bangkok to Manchester",
    kicker: "Background",
    oneLine: "Raised in Bangkok, studying in Manchester.",
    problem: "I wanted UK engineering training without losing the market I want to build in.",
    action: "I study in Manchester and keep building in Bangkok. CreamCat ran through Thai gyms in the same stretch that AirfoilLearner was starting in Manchester.",
    result: "The degree is in the UK and the ventures have run in both countries.",
    meta: { role: "Background", period: "Ongoing", place: "Bangkok / Manchester", outcome: "Cross-market" },
    tags: ["background", "APAC", "cross-market"],
  },
  {
    slug: "founder",
    faceId: "story",
    title: "Founder",
    kicker: "Ventures / Building",
    oneLine: "Two companies, run alongside the degree.",
    problem: "I wanted to run something real while it was still cheap to be wrong.",
    action: "I co-founded AirfoilLearner in Manchester and founded CreamCat in Bangkok, both alongside the degree.",
    result: "AirfoilLearner is still in development. CreamCat sells through Bangkok gyms.",
    meta: { role: "Founder", period: "2025 to present", place: "Manchester / Bangkok", outcome: "Two ventures" },
    tags: ["founder", "ventures"],
  },
];

export function isFaceId(value: unknown): value is FaceId {
  return typeof value === "string" && faceOrder.includes(value as FaceId);
}

export function parseFaceQuery(value: string | string[] | undefined): FaceId | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isFaceId(candidate) ? candidate : null;
}
