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
  thesis: "Founder and strategist, trained as an engineer.",
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
    thesis: "I connect customer evidence, unit economics, and execution into decisions people can act on.",
    proofs: [
      { label: "Deliveroo student plan", result: "EMEA strategy runner-up", href: "/work/deliveroo-case" },
      { label: "Bus In Case 2026", result: "Round 1 in, 1,200 teams", href: "/work/bus-in-case" },
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
    thesis: "I use markets and capital allocation as disciplines for making clearer decisions under uncertainty.",
    proofs: [
      { label: "Shade Tree Fund", result: "Won a \u00A35k investment allocation", href: "/work/shade-tree" },
      { label: "TK Partners", result: "Incoming venture-capital intern", href: "/work/tk-partners" },
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
    thesis: "I am comfortable working where the answer is not obvious yet: labs, prototypes, and first-principles investigation.",
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
    thesis: "Bangkok raised, Manchester trained. I am at my best where engineering meets a P&L.",
    proofs: [
      { label: "University of Manchester", result: "91% first-year average, predicted First", href: "/work/manchester" },
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
    oneLine: "An AI product for a slow and expensive aerodynamic optimisation loop.",
    problem: "Airfoil and CFD optimisation is iterative, specialist, and costly. The early product needed to solve a real workflow problem rather than simply place AI beside an engineering process.",
    action: "I co-founded the venture, interviewed more than 20 engineers and students, mapped the workflow bottlenecks, and used that evidence to define the first product scope, feature priorities, and pricing direction.",
    result: "AirfoilLearner received \u00A38k from Manchester's Venture Builder and reached 221% month-on-month user growth, with a market-fit report scoring an NPS of 35. The product remains in active development.",
    meta: { role: "Co-Founder", period: "Sep 2025 to present", place: "Manchester, UK", outcome: "\u00A38k, Venture Builder" },
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
    action: "I synthesised a graphene quantum-dot sensor from a plant leaf, engineered the electrodes and electrolyte for a graphene supercapacitor, and characterised materials with Raman spectroscopy for the terahertz team.",
    result: "The sensor detected heavy metals as fluorescence under UV light, and the supercapacitor reached around 20% higher measured capacitance.",
    meta: { role: "Research Trainee", period: "Jul to Aug 2024", place: "Pathum Thani, Thailand", outcome: "Working sensor, ~20% capacitance gain" },
    tags: ["graphene", "sensors", "hardware"],
  },
  {
    slug: "solar-cv",
    faceId: "engineering",
    title: "Solar-Panel Inspection",
    kicker: "Engineering / Computer vision",
    oneLine: "A defect-inspection model designed for utility-scale solar operations.",
    problem: "Manual inspection does not scale cleanly across large solar farms. The technical problem was hotspot detection; the commercial question was whether drone inspection could produce a credible operating return.",
    action: "I built and benchmarked a convolutional neural network, then adapted it to automate panel inspection in place of manual thermal checks.",
    result: "The model reached 97.2% validation accuracy and cut projected inspection time by around 80%.",
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
    action: "I founded the business, built a three-route channel P&L, and chose a partner-led model to reach gym channels without a capital-heavy retail footprint.",
    result: "CreamCat launched through gym channels on a capital-light, partner-led model.",
    meta: { role: "Founder", period: "Jul to Nov 2025", place: "Bangkok, Thailand", outcome: "Gym-channel launch" },
    tags: ["founder", "operations", "go-to-market"],
  },
  {
    slug: "bus-in-case",
    faceId: "strategy",
    title: "Bus In Case 2026",
    kicker: "Strategy / Brand / Gen Z",
    oneLine: "A year-long Gen Z campaign for Taokaenoi, entered against roughly 1,200 teams.",
    problem: "Taokaenoi owns 64% of Thai crispy seaweed and near-total 7-Eleven coverage, yet holds no single consumption occasion. The brief asked for a year-long campaign on a THB 2,000,000 budget that lifts purchase frequency across the year.",
    action: "I read Taokaenoi's 246-page annual filing to check the market data, which showed the brand already runs the creator-led playbook at scale. We rebuilt the strategy around the gap that left. The THB 11 pack became a good-luck charm eaten before exams and interviews, with a working precedent in Japan's Kit Kat.",
    result: "The funnel priced out at 48,600 trials and 12,229 repeat buyers in year one. Round 1 went in against roughly 1,200 teams, with the Top 20 announced in late July.",
    meta: { role: "Strategy lead", period: "Jul 2026", place: "Thailand (online)", outcome: "Round 1 in, 1,200 teams" },
    tags: ["strategy", "brand", "consumer"],
  },
  {
    slug: "kmt-group",
    faceId: "strategy",
    title: "KMT Group",
    kicker: "Consulting / Thai SMEs",
    oneLine: "An early consulting practice for Thai SMEs, currently paused.",
    problem: "Thai SMEs and family businesses often run on manual operations with little data. The idea was to embed with one business, fix a single operational problem, and build something that works instead of handing over a slide deck.",
    action: "I took on early engagements with an SME and a private school, scoping lead generation and operations work.",
    result: "This is an experience I am still working on, not a registered company or a finished track record. It is paused in 2026 while I focus on hackathon builds.",
    meta: { role: "Founder (paused)", period: "2025 to 2026", place: "Thailand", outcome: "Paused, early-stage" },
    tags: ["consulting", "SME", "operations"],
  },
  {
    slug: "shade-tree",
    faceId: "finance",
    title: "Shade Tree Fund",
    kicker: "Finance / Investing",
    oneLine: "A 25-year buy thesis on Prysmian that won real capital to manage.",
    problem: "The Shade Tree Fund allocates real capital to the winning team. The question was whether Prysmian, a EUR 20bn cable manufacturer, was a credible 25-year hold on the electrification cycle.",
    action: "We valued Prysmian three ways, a DCF, trading comps, and a Monte Carlo over the growth assumptions, and let the disagreement between the methods set the range. We anchored the terminal value to nominal GDP rather than an exit multiple.",
    result: "We landed at EUR 124.80 a share, 28.6% above market, and won a £5k allocation to manage. I still track the position.",
    meta: { role: "Winner", period: "Feb 2026", place: "London, UK", outcome: "Won £5k allocation" },
    tags: ["investing", "valuation", "equities"],
  },
  {
    slug: "tk-partners",
    faceId: "finance",
    title: "TK Partners",
    kicker: "Venture Capital / Health-tech",
    oneLine: "An incoming venture-capital internship on an early-stage health-tech team.",
    problem: "Early-stage investing rewards judgement about markets and founders before the numbers are clean.",
    action: "I join the investment team in summer 2026 to support sourcing, diligence, and market work on early-stage health-tech.",
    result: "Incoming for July to September 2026, taken as a warm route toward strategy and investing roles in the region.",
    meta: { role: "Incoming Analyst Intern", period: "Jul to Sep 2026", place: "Bangkok, Thailand", outcome: "Incoming" },
    tags: ["venture capital", "health-tech", "diligence"],
  },
  {
    slug: "trading",
    faceId: "finance",
    title: "Systematic Trading",
    kicker: "Markets / Quant",
    oneLine: "Self-directed systematic trading on funded capital.",
    problem: "Discretionary trading does not compound. I wanted a rules-based process that survives live costs and a fixed drawdown limit.",
    action: "I build and test strategies on MT5, size positions against risk limits, and run them on funded accounts.",
    result: "Funded through FTMO at a live Sharpe near 1.6 under a 10% drawdown cap. I keep it as a personal discipline rather than a headline.",
    meta: { role: "Self-directed", period: "2024 to present", place: "Remote", outcome: "FTMO funded" },
    tags: ["quant", "systematic", "risk"],
  },
  {
    slug: "issdc",
    faceId: "research",
    title: "ISSDC",
    kicker: "Research / Systems / NASA-sponsored",
    oneLine: "A lunar-settlement design that placed as a global runner-up.",
    problem: "The competition compresses a full lunar-settlement proposal into a 48-hour sprint, from power systems to the business model, judged against international teams.",
    action: "I led the power-systems and business-model work inside a large multi-role company, holding the technical and commercial case together under deadline.",
    result: "The team placed as a global runner-up at the NASA-sponsored ISSDC final in Florida.",
    meta: { role: "Power and business lead", period: "Jul to Aug 2024", place: "Florida, USA", outcome: "Global runner-up" },
    tags: ["systems", "space", "leadership"],
  },
  {
    slug: "manchester",
    faceId: "story",
    title: "University of Manchester",
    kicker: "Education / EEE",
    oneLine: "Electrical and Electronic Engineering, on track for a First.",
    problem: "I chose engineering for the technical foundation, then pushed it toward commercial and strategy work rather than a pure hardware path.",
    action: "I study EEE while running ventures, case competitions, and consulting work alongside the degree.",
    result: "91% average across the first year, on a predicted First. I entered on A-levels including A* Maths and A* Chemistry.",
    meta: { role: "BEng EEE", period: "2025 to 2028", place: "Manchester, UK", outcome: "91%, predicted First" },
    tags: ["engineering", "education", "first-class"],
  },
  {
    slug: "bangkok-to-manchester",
    faceId: "story",
    title: "Bangkok to Manchester",
    kicker: "Background",
    oneLine: "A Bangkok base and UK training, aimed back at Southeast Asia.",
    problem: "Most technical training sits far from the markets I want to build in.",
    action: "I train in the UK and build ventures and consulting reps across both the UK and Thailand, keeping Bangkok as the long-term base.",
    result: "The result is a cross-market angle. I pair UK engineering and commercial training with Southeast Asian markets and clients.",
    meta: { role: "Background", period: "Ongoing", place: "Bangkok / Manchester", outcome: "Cross-market" },
    tags: ["background", "APAC", "cross-market"],
  },
  {
    slug: "founder",
    faceId: "story",
    title: "Founder",
    kicker: "Ventures / Building",
    oneLine: "Two ventures built in parallel with the degree.",
    problem: "I wanted to build real things while the stakes were still low.",
    action: "I co-founded AirfoilLearner, a deep-tech AI startup in Manchester, and founded CreamCat, a high-protein gelato venture in Bangkok, running both alongside the degree.",
    result: "AirfoilLearner is in active development with £8k of Venture Builder backing and 221% month-on-month growth. CreamCat launched through gym channels in Bangkok.",
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
