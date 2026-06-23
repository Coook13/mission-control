// ============================================================
// SITE DATA. All copy is CV-verified. No invented numbers.
// ============================================================

export type Project = {
  slug: string;
  title: string;
  kicker: string;
  oneLine: string;
  summary: string[];
  meta: { role: string; period: string; place: string; outcome: string };
  tags: string[];
};

export type IndexRow = {
  num: string;
  title: string;
  kicker: string;
  year: string;
  slug?: string;
  /* OPTIONAL hover-preview photo for rows that have no detail page (no slug).
     Slugged rows resolve /img/work/<slug>.jpg automatically; this lets a
     slug-less row (e.g. ISSDC) still show a real photo instead of the fallback. */
  img?: string;
};

export const profile = {
  name: "Baramee Thanawarothon",
  nickname: "Micky",
  logotype: "mt.",
  roles: ["Founder", "Engineer", "Strategist", "VC Intern, Incoming"],
  headline: { line1: "I build things", line2: "that work." },
  subline: "With the right strategy.",
  caption: { left: "Baramee (Micky) Thanawarothon", right: "Manchester / Bangkok" },
  storyHead: ["Engineer by training,", "founder by habit."],
  story: [
    "First-year Electronic Engineering at Manchester, predicted a First at 91%. I co-founded an AI tool for airfoil optimisation, ran a gelato business at a 70% gross margin, and built a consultancy for Thai SMEs.",
    "I learn by shipping: hackathons, case competitions, research labs. Runner-up at the EMEA Strategy Consulting Summit in London, where I pitched Deliveroo's student-plan economics to executives. Next stop, TK Partners as a VC intern.",
  ],
  email: "micky.thana@gmail.com",
  linkedin: { label: "baramee-thanawarothon", href: "https://linkedin.com/in/baramee-thanawarothon/" },
  contactLead: { pre: "Let's build something that ", em: "works", post: "." },
};

export const workIndex: IndexRow[] = [
  { num: "01", title: "AirfoilLearner", kicker: "AI for CFD optimisation", year: "2025", slug: "airfoillearner" },
  { num: "02", title: "Deliveroo Case", kicker: "EMEA Summit, runner-up", year: "2026", slug: "deliveroo-case" },
  { num: "03", title: "NECTEC", kicker: "Graphene R&D", year: "2024", slug: "nectec-research" },
  { num: "04", title: "Solar Inspection", kicker: "Computer vision, 97.2%", year: "2024", slug: "solar-cv" },
  { num: "05", title: "AccelerateMe", kicker: "ARM hackathon, 2nd place", year: "2025", slug: "accelerateme-arm" },
  { num: "06", title: "CreamCat Gelato", kicker: "70% margin venture", year: "2025", slug: "creamcat-gelato" },
  { num: "07", title: "KMT Group", kicker: "Thai SME consultancy", year: "2025" },
  { num: "08", title: "Shade Tree Fund", kicker: "Won a £5k allocation", year: "2026", img: "/img/work/shade-tree.jpg" },
  { num: "09", title: "ISSDC, NASA", kicker: "Global finalist", year: "2024", img: "/img/work/issdc.jpg" },
  { num: "10", title: "UKROC", kicker: "Robotics, regional 1st", year: "", img: "/img/work/ukroc.jpg" },
];

export const projects: Project[] = [
  {
    slug: "airfoillearner",
    title: "AirfoilLearner",
    kicker: "Venture",
    oneLine: "AI tool for airfoil and CFD optimisation. Raised £5k via Manchester's Venture Builder.",
    summary: [
      "Co-founded AirfoilLearner, an AI product targeting the slow, expensive loop of airfoil and CFD optimisation. Led early research on fluid-dynamics workflows to pinpoint the real pain points and define the initial product scope.",
      "Interviewed 50+ engineers and students to test demand and prioritise features and pricing, cutting projected churn by around 20%. Raised £5k through Manchester's Venture Builder; the product is in active development.",
    ],
    meta: { role: "Co-Founder", period: "Sep 2025 to present", place: "Manchester, UK", outcome: "£5k raised, in development" },
    tags: ["founder", "AI", "CFD"],
  },
  {
    slug: "deliveroo-case",
    title: "Deliveroo Student Plan",
    kicker: "Consulting",
    oneLine: "Runner-up at the EMEA Strategy Consulting Summit. Pitched the unit economics to executives.",
    summary: [
      "At the EMEA Strategy Consulting Summit in London, quantified the unit economics of Deliveroo's student plan, linking pricing, contribution margin, and acquisition cost to a clear path to profitability.",
      "Designed the rollout from a campus beta to a Freshers launch, wiring in verification, referral loops, and term-time retention. Pitched the recommendation to executives and placed runner-up.",
    ],
    meta: { role: "Runner-up (2nd)", period: "Feb 2026", place: "London, UK", outcome: "Runner-up, pitched to execs" },
    tags: ["strategy", "unit economics", "2nd place"],
  },
  {
    slug: "nectec-research",
    title: "NECTEC R&D",
    kicker: "Research",
    oneLine: "Graphene quantum-dot sensor and supercapacitor, built as a NECTEC research trainee.",
    summary: [
      "As a research trainee at NECTEC, Thailand's National Electronics and Computer Technology Center, manufactured a graphene quantum-dot sensor that met accuracy and unit-cost targets for the commercial agricultural industry.",
      "Engineered 20 electrodes for a graphene supercapacitor using electrochemical impedance and recommended an electrolyte redesign. Built a comparative cost and pricing model showing a cost-of-goods advantage versus peer designs.",
    ],
    meta: { role: "Research Trainee", period: "Jul to Aug 2024", place: "Pathum Thani, Thailand", outcome: "Met accuracy and cost targets" },
    tags: ["hardware", "graphene", "sensors"],
  },
  {
    slug: "solar-cv",
    title: "Solar-Panel Inspection",
    kicker: "Computer Vision",
    oneLine: "Computer-vision models for solar-panel defect inspection at 97.2% accuracy.",
    summary: [
      "Built a convolutional model to detect hotspots on solar panels at 97.2% validation accuracy, then adapted it to drone footage for utility-scale PV inspections, projecting savings of about £360k per year per 100 MW.",
      "Benchmarked activation functions and built a five-year ROI and pricing model for drone-based inspection, forecasting about £200k ARR with defined price-to-win bands.",
    ],
    meta: { role: "Engineering Intern", period: "Sep 2023 to Jun 2024", place: "Remote", outcome: "97.2% accuracy, £360k/yr modelled" },
    tags: ["computer vision", "energy", "modelling"],
  },
  {
    slug: "accelerateme-arm",
    title: "AccelerateMe / ARM",
    kicker: "Hackathon",
    oneLine: "2nd place. Coded the inverse kinematics for the ARM robotics challenge.",
    summary: [
      "Placed 2nd at the AccelerateMe Hackathon's ARM robotics challenge by coding the inverse kinematics that drove the arm's motion under a tight build window.",
      "A fast, pressure-tested build. The same ship-it-now problem solving shows up in NASA's ISSDC, where the team reached the global final, and in UKROC, a regional 1st in robotics.",
    ],
    meta: { role: "2nd place", period: "Hackathon", place: "UK", outcome: "2nd, inverse kinematics" },
    tags: ["robotics", "inverse kinematics", "fast build"],
  },
  {
    slug: "creamcat-gelato",
    title: "CreamCat Gelato",
    kicker: "Venture",
    oneLine: "Founded a high-protein gelato business operating at a 70% gross margin.",
    summary: [
      "Founded CreamCat Gelato, a high-protein gelato startup targeting gym channels, and ran it at a 70% gross profit margin.",
      "Built a three-route channel P&L and selected a partner-led model after factoring in gym commission, then secured a launch partnership on a capital-light plan.",
    ],
    meta: { role: "Founder", period: "Jul to Nov 2025", place: "Bangkok, Thailand", outcome: "70% gross margin" },
    tags: ["founder", "ops", "go-to-market"],
  },
];

export const nav = [
  { label: "Story", href: "/story" },
  { label: "Work", href: "/work" },
  { label: "Contact", href: "/contact" },
];

export const facts = [
  { n: "91%", k: "first-year average, predicted First" },
  { n: "x3", k: "companies founded" },
  { n: "£5k", k: "raised for AirfoilLearner" },
  { n: "£5k", k: "investment allocation won" },
  { n: "97.2%", k: "computer-vision accuracy" },
  { n: "2nd", k: "EMEA Strategy Summit, London" },
];

export const timeline = [
  { year: "2023", what: "Computer-vision models for solar inspection. 97.2% accuracy." },
  { year: "2024", what: "NECTEC research trainee: graphene quantum-dot sensor and supercapacitor. ISSDC NASA global finalist." },
  { year: "2025", what: "Moved to Manchester. Co-founded AirfoilLearner, founded CreamCat Gelato and KMT Group. 2nd at the AccelerateMe ARM hackathon." },
  { year: "2026", what: "Runner-up, EMEA Strategy Consulting Summit. Won a £5k allocation at Shade Tree Fund. TK Partners VC internship incoming." },
];

export const storyLong = [
  "I grew up in Bangkok and study Electronic Engineering at Manchester, predicted a First at 91%. The degree is the training. The habit is building.",
  "By nineteen I had built computer-vision models for solar farms, manufactured graphene sensors in a national lab, and reached NASA's ISSDC global final. Then I started founding things: an AI tool for airfoil optimisation that raised £5k, a gelato brand that ran at 70% gross margin, a consultancy for Thai SMEs.",
  "Strategy is the other half. I placed 2nd at the EMEA Strategy Consulting Summit pitching Deliveroo's student-plan economics to executives, won a £5k investment allocation at Shade Tree Fund, and join TK Partners this summer as a VC intern.",
  "Manchester taught me to ship fast. Bangkok keeps me hungry. I am at my best where engineering meets a P&L.",
];
