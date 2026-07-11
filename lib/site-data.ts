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
  thesis: "Engineer, founder, strategist, investor.",
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
    thesis: "I turn technical problems into working systems, from vision models to robotics and aerodynamic tools.",
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
    thesis: "I test demand, build the economics, and ship ventures far enough for the market to answer back.",
    proofs: [
      { label: "AirfoilLearner", result: "Co-founded, \u00A35k raised", href: "/work/airfoillearner" },
      { label: "CreamCat Gelato", result: "Founded, 70% gross margin", href: "/work/creamcat-gelato" },
      { label: "KMT Group", result: "Consultancy for Thai SMEs" },
    ],
    action: { label: "View AirfoilLearner", href: "/work/airfoillearner" },
  },
  strategy: {
    id: "strategy",
    code: "STR",
    label: "Strategy",
    navDescription: "Markets & execution",
    color: "#F2C94C",
    thesis: "I connect customer evidence, unit economics, and execution into decisions people can act on.",
    proofs: [
      { label: "Deliveroo student plan", result: "EMEA strategy runner-up", href: "/work/deliveroo-case" },
      { label: "AirfoilLearner", result: "50+ customer interviews", href: "/work/airfoillearner" },
      { label: "KMT Group", result: "Commercial work for Thai SMEs" },
    ],
    action: { label: "Read the Deliveroo case", href: "/work/deliveroo-case" },
  },
  finance: {
    id: "finance",
    code: "FIN",
    label: "Finance",
    navDescription: "Capital & quantitative",
    color: "#2F9E5B",
    thesis: "I use markets and capital allocation as disciplines for making clearer decisions under uncertainty.",
    proofs: [
      { label: "Shade Tree Fund", result: "Won a \u00A35k investment allocation" },
      { label: "TK Partners", result: "Incoming venture-capital intern" },
      { label: "Systematic trading", result: "FX and quantitative strategies" },
    ],
    action: { label: "Discuss markets", href: `mailto:${profile.email}` },
  },
  research: {
    id: "research",
    code: "R&D",
    label: "Research",
    navDescription: "Sensors & materials",
    color: "#F28A2E",
    thesis: "I am comfortable working where the answer is not obvious yet: labs, prototypes, and first-principles investigation.",
    proofs: [
      { label: "NECTEC sensor", result: "Graphene quantum-dot R&D", href: "/work/nectec-research" },
      { label: "Supercapacitor", result: "Engineered and tested 20 electrodes", href: "/work/nectec-research" },
      { label: "ISSDC", result: "NASA global finalist" },
    ],
    action: { label: "View NECTEC research", href: "/work/nectec-research" },
  },
  story: {
    id: "story",
    code: "MICKY",
    label: "Story",
    navDescription: "Background & CV",
    color: "#ECEDEF",
    thesis: "Bangkok raised, Manchester trained. I am at my best where engineering meets a P&L.",
    proofs: [
      { label: "University of Manchester", result: "91% first-year average, predicted First" },
      { label: "Bangkok to Manchester", result: "Technical training with a commercial lens" },
      { label: "Founder", result: "Three companies built" },
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
    oneLine: "An AI product for a slow and expensive aerodynamic optimisation loop.",
    problem: "Airfoil and CFD optimisation is iterative, specialist, and costly. The early product needed to solve a real workflow problem rather than simply place AI beside an engineering process.",
    action: "I co-founded the venture, interviewed more than 50 engineers and students, mapped the workflow bottlenecks, and used that evidence to define the first product scope, feature priorities, and pricing direction.",
    result: "We raised \u00A35k through Manchester's Venture Builder. The research also identified changes expected to reduce projected churn by around 20%, and the product remains in active development.",
    meta: { role: "Co-Founder", period: "Sep 2025 to present", place: "Manchester, UK", outcome: "\u00A35k raised" },
    tags: ["founder", "AI", "CFD"],
  },
  {
    slug: "deliveroo-case",
    faceId: "strategy",
    title: "Deliveroo Student Plan",
    kicker: "Strategy / Unit economics",
    oneLine: "A commercially grounded student proposition pitched to executives in London.",
    problem: "The case required a student plan that could acquire users without hiding weak economics behind growth. Pricing, contribution margin, acquisition cost, verification, and retention had to work as one system.",
    action: "I quantified the unit economics and designed a rollout from campus beta to Freshers launch, including verification, referral loops, and term-time retention mechanics.",
    result: "The recommendation placed runner-up at the EMEA Strategy Consulting Summit and was pitched directly to executives.",
    meta: { role: "Runner-up", period: "Feb 2026", place: "London, UK", outcome: "2nd place" },
    tags: ["strategy", "unit economics", "go-to-market"],
  },
  {
    slug: "nectec-research",
    faceId: "research",
    title: "NECTEC R&D",
    kicker: "Research / Materials",
    oneLine: "Graphene sensor and supercapacitor work inside Thailand's national electronics research centre.",
    problem: "The research brief combined technical performance with commercial constraints: sensing accuracy, manufacturability, electrode behaviour, and unit cost all mattered.",
    action: "I manufactured a graphene quantum-dot sensor, engineered 20 supercapacitor electrodes, ran electrochemical impedance work, and built a comparative cost and pricing model.",
    result: "The sensor met its accuracy and unit-cost targets. I recommended an electrolyte redesign and demonstrated a cost-of-goods advantage against peer designs.",
    meta: { role: "Research Trainee", period: "Jul to Aug 2024", place: "Pathum Thani, Thailand", outcome: "Accuracy and cost targets met" },
    tags: ["graphene", "sensors", "hardware"],
  },
  {
    slug: "solar-cv",
    faceId: "engineering",
    title: "Solar-Panel Inspection",
    kicker: "Engineering / Computer vision",
    oneLine: "A defect-inspection model designed for utility-scale solar operations.",
    problem: "Manual inspection does not scale cleanly across large solar farms. The technical problem was hotspot detection; the commercial question was whether drone inspection could produce a credible operating return.",
    action: "I built and benchmarked a convolutional model, adapted the workflow to drone footage, and developed a five-year ROI and pricing model for deployment.",
    result: "The model reached 97.2% validation accuracy. The operating model projected roughly \u00A3360k in annual savings per 100 MW and about \u00A3200k in potential ARR.",
    meta: { role: "Engineering Intern", period: "Sep 2023 to Jun 2024", place: "Remote", outcome: "97.2% accuracy" },
    tags: ["computer vision", "energy", "modelling"],
  },
  {
    slug: "accelerateme-arm",
    faceId: "engineering",
    title: "AccelerateMe / ARM",
    kicker: "Engineering / Robotics",
    oneLine: "A pressure-tested robotics build completed inside a hackathon window.",
    problem: "The ARM challenge needed reliable robot-arm motion under a tight build deadline, leaving little room for slow iteration or fragile control logic.",
    action: "I coded the inverse kinematics that drove the arm's movement and integrated it into the team's working prototype.",
    result: "The project placed second at the AccelerateMe Hackathon's ARM robotics challenge.",
    meta: { role: "Robotics Engineer", period: "2025", place: "UK", outcome: "2nd place" },
    tags: ["robotics", "inverse kinematics", "rapid build"],
  },
  {
    slug: "creamcat-gelato",
    faceId: "venture",
    title: "CreamCat Gelato",
    kicker: "Venture / Operations",
    oneLine: "A high-protein gelato business built around capital-light distribution.",
    problem: "The venture needed a route into gym channels that could preserve margin after commissions while avoiding a capital-heavy retail footprint.",
    action: "I founded the business, built a three-route channel P&L, selected a partner-led model, and secured a launch partnership.",
    result: "CreamCat operated at a 70% gross profit margin with a capital-light route to market.",
    meta: { role: "Founder", period: "Jul to Nov 2025", place: "Bangkok, Thailand", outcome: "70% gross margin" },
    tags: ["founder", "operations", "go-to-market"],
  },
];

export function isFaceId(value: unknown): value is FaceId {
  return typeof value === "string" && faceOrder.includes(value as FaceId);
}

export function parseFaceQuery(value: string | string[] | undefined): FaceId | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isFaceId(candidate) ? candidate : null;
}
