/* ══════════════════════════════════════════════════════════
   SITE CONTENT — the only file you need to edit
   ──────────────────────────────────────────────────────────
   Every name, link, project, skill and certificate on the site (and in
   the generated résumé, see scripts/build-resume.mjs) comes from here.

   Rules this file follows — keep them when you edit:
   · Only facts that can be backed up (résumé, thesis manuscript,
     public repos). No invented metrics, links or features.
   · Optional fields left empty are simply not rendered, so missing
     info never shows up as "TODO" on the live site.
   ══════════════════════════════════════════════════════════ */

export type Link = { label: string; href: string };

export const profile = {
  name: "Elroni Quiñones",
  /** Plain-ASCII spelling for file names / metadata that dislike "ñ". */
  nameAscii: "Elroni Quinones",
  initials: "EQ",
  headline: "Software Developer | Web & Mobile Applications | Automation",
  /** One line for the hero, under the name. */
  role: "Early-career software developer — web & mobile apps",
  intro:
    "I build practical web and mobile applications — from a franchise order portal now used by a real company to an offline multiplayer game for low-spec Android phones. I care about clean UI, reliable functionality and shipping things people actually use.",
  /** Shown in the hero only while true. Set to false once hired. */
  openToWork: true,
  availability: "Open to entry-level roles",
  location: "Dasmariñas, Cavite, Philippines",
  email: "quinoneselroni@gmail.com",
  /** Résumé only — not shown on the website. Remove to omit. */
  phone: "0908 583 8289",
  github: "https://github.com/N0rrtthh",
  githubHandle: "N0rrtthh",
  linkedin: "https://www.linkedin.com/in/elroni-quinones",
  linkedinHandle: "elroni-quinones",
  /** Production URL, e.g. "https://elroni.dev". Used for canonical, sitemap
      and Open Graph. Leave empty until the domain is known. */
  siteUrl: "",
  resumeFile: "resume/Elroni-Quinones-Resume.pdf",
  coreAreas: ["Web applications", "Mobile apps (Flutter)", "Game development (Godot)", "Automation & CI", "UI/UX"],
};

export const education = [
  {
    school: "Cavite State University – Main Campus",
    place: "Indang, Cavite",
    degree: "BS Computer Science",
    period: "2022 – Present",
    note: "Thesis: WaterWise — an educational game using deterministic rule-based adaptive difficulty and CRDT synchronization (defended 2026).",
  },
  {
    school: "Emilio Aguinaldo College – Cavite",
    place: "Dasmariñas, Cavite",
    degree: "Senior High School, TVL – ICT",
    period: "2021 – 2022",
    note: "",
  },
];

export const experience = [
  {
    role: "Software Engineer & Application Developer Intern (OJT)",
    org: "BidaBoss Inc.",
    place: "Pasig City",
    period: "Jul 2025 – Dec 2025",
    points: [
      "Developed the BidaBoss Agent Portal, a centralized web-based franchise order management system, with React and Node.js on MySQL — now live and in use by the company.",
      "Built the BidaBoss e-commerce mobile app in Flutter with a MySQL backend: sales overview, order statuses, inventory, store and orders.",
    ],
  },
];

export const leadership = [
  { role: "VP for Public Relations & Information", org: "Computer Science Student Organization, CvSU", period: "2023 – 2024" },
  { role: "Spade Member", org: "Amazon Web Services Learning Club, CvSU", period: "2024 – 2025" },
  { role: "Member", org: "Junior Philippine Computer Society (JPCS), CvSU Chapter", period: "2023 – 2024" },
];

/* Skills: only tools used in the projects and work above. */
export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["JavaScript", "TypeScript", "Dart", "Python", "GDScript", "SQL", "HTML", "CSS"] },
  { group: "Web", items: ["React", "Next.js", "Node.js", "Vite", "Tailwind CSS"] },
  { group: "Mobile & Games", items: ["Flutter", "FlutterFlow", "React Native", "Godot (Android export)"] },
  { group: "Backend & Data", items: ["MySQL", "Firebase", "Supabase", "MongoDB", "REST APIs"] },
  { group: "Tools & Workflow", items: ["Git & GitHub", "GitHub Actions (CI/CD)", "GitHub Pages", "Android Studio", "Figma", "VS Code"] },
];

export type Project = {
  slug: string;
  name: string;
  kind: string;
  year: string;
  /** Hidden from the site until true — for drafts awaiting real details. */
  published: boolean;
  problem: string;
  contribution: string;
  tech: string[];
  features: string[];
  /** Case-study panel. Empty strings/arrays are skipped. */
  details: {
    role: string;
    implementation: string[];
    challenges: { challenge: string; approach: string }[];
    outcome: string[];
  };
  image?: string; // key into src/assets (see components/ProjectMedia.astro)
  phoneImage?: string;
  github?: Link[];
  live?: Link;
  note?: string; // e.g. "Private company codebase"
};

export const projects: Project[] = [
  {
    slug: "waterwise",
    name: "WaterWise",
    kind: "Android game · Undergraduate thesis",
    year: "2025 – 2026",
    published: true,
    problem:
      "Adaptive difficulty and co-op play are hardest to deliver on the older, low-spec Android phones and unreliable internet many Filipino learners have.",
    contribution:
      "Co-developed the game in Godot as one of three thesis proponents, from gameplay to the difficulty and sync systems.",
    tech: ["Godot", "GDScript", "Android", "CRDT"],
    features: [
      "Single-player and offline co-op multiplayer over a phone's Wi-Fi hotspot",
      "Rule-based adaptive difficulty — no trained model, no internet",
      "Teaches water conservation and reuse through minigames",
    ],
    details: {
      role: "Thesis co-proponent and developer in a three-person team, working in Scrum sprints.",
      implementation: [
        "Rolling-window adaptive difficulty: a Weighted Proficiency Index over the last five games, updated in constant time.",
        "Shared co-op score synchronized with an integer-only G-Counter CRDT, sent as compact binary integers instead of JSON.",
        "Built and exported from Godot to Android; evaluated on a Motorola Moto E5 Plus.",
      ],
      challenges: [
        {
          challenge: "On-device machine learning was too heavy for legacy phones.",
          approach:
            "Used a deterministic rule-based algorithm instead. A TensorFlow Lite baseline used 2.6–2.7× the CPU and ran hotter (61.7 °C mean peak vs. 56.7 / 56.0 °C).",
        },
        {
          challenge: "Players share unreliable local connections.",
          approach:
            "A conflict-free replicated counter keeps every copy of the score consistent without a server, even with dropped packets.",
        },
      ],
      outcome: [
        "28.2–29.6 FPS average on a Moto E5 Plus, with 0.59–0.66 ms difficulty updates.",
        "Score copies were identical in all 256 multiplayer rounds and converged in all 180 simulated trials at 10–90% packet loss.",
        "Each sync update was 76–83% smaller than the same values in JSON.",
      ],
    },
    image: "waterwise",
    github: [{ label: "Source", href: "https://github.com/N0rrtthh/WaterWise" }],
  },
  {
    slug: "bidaboss",
    name: "BidaBoss",
    kind: "Web portal + mobile app · Internship",
    year: "2025",
    published: true,
    problem:
      "A franchise business needed one place for agents to sign in, place and track orders, plus mobile access to sales and stock.",
    contribution:
      "Built the web Agent Portal and the e-commerce mobile app during my internship at BidaBoss Inc.",
    tech: ["React", "Node.js", "MySQL", "Flutter", "Dart"],
    features: [
      "Agent Portal: centralized franchise order management, live in production",
      "Mobile app: overall sales, order statuses (to approve, to pick up, out for delivery)",
      "Inventory, store and order screens for franchise agents",
    ],
    details: {
      role: "Software Engineer & Application Developer Intern (OJT), Jul – Dec 2025.",
      implementation: [
        "Agent Portal: React front end with a Node.js back end on MySQL, with agent sign-in and order management.",
        "Mobile app: Flutter with a MySQL backend, covering sales, order status, shop assessment, inventory, store and orders.",
      ],
      challenges: [],
      outcome: ["The Agent Portal is live and in active use by BidaBoss Inc. for franchise order management."],
    },
    image: "bidaboss-portal",
    phoneImage: "bidaboss-mobile-dashboard",
    note: "Company project — source code is private.",
  },
  {
    slug: "quickattend",
    name: "QuickAttend",
    kind: "Web + mobile attendance system",
    year: "2024",
    published: true,
    problem: "Manual attendance taking is slow, error-prone and easy to fake.",
    contribution: "Built both the web admin app and the mobile scanner app in FlutterFlow.",
    tech: ["FlutterFlow", "Flutter", "Dart", "Firebase"],
    features: [
      "Web app generates a QR code per session and manages attendance",
      "Mobile app scans the QR and uses face recognition as a second factor",
      "Google sign-in on the web admin",
    ],
    details: {
      role: "Solo developer of the web and mobile apps.",
      implementation: [
        "Two linked FlutterFlow (Dart) apps: a web admin that issues session QR codes and records attendance, and a mobile scanner.",
        "Face recognition on the mobile app as two-factor verification on top of the QR scan.",
        "Later rebuilt as a React Native version of the mobile app.",
      ],
      challenges: [
        {
          challenge: "A QR code on its own can be screenshotted and shared.",
          approach: "Pairing the scan with face recognition ties each check-in to the person actually present.",
        },
      ],
      outcome: [],
    },
    image: "quick-attend",
    github: [
      { label: "Web", href: "https://github.com/N0rrtthh/Quick-Attend-Web" },
      { label: "Mobile", href: "https://github.com/N0rrtthh/Quick-Attend-Mobile" },
    ],
    live: { label: "Live demo", href: "https://quick-attend-web-1dsail.flutterflow.app/" },
  },
  {
    slug: "resumaker",
    name: "ResuMaker",
    kind: "Web app",
    year: "2026",
    published: true,
    problem: "Most résumé builders are paywalled or ignore what gets past applicant tracking systems.",
    contribution: "Designed and built it solo — React, TypeScript and Vite, deployed with GitHub Actions.",
    tech: ["React", "TypeScript", "Vite", "GitHub Actions"],
    features: [
      "Two-panel editor with a live résumé preview",
      "ATS-inspired quality score with actionable feedback",
      "JSON import/export, local drafts and print-to-PDF",
    ],
    details: {
      role: "Solo designer and developer.",
      implementation: [
        "React 19 + TypeScript + Vite single-page app with structured controls for every résumé section.",
        "Optional AI review through the OpenAI API with a local fallback; the key stays in the browser.",
        "Continuous deployment to GitHub Pages through GitHub Actions.",
      ],
      challenges: [
        {
          challenge: "Not every user has (or wants to paste) an API key.",
          approach: "AI review is optional — without a key it falls back to a local checklist, and drafts never leave the browser.",
        },
      ],
      outcome: [],
    },
    image: "resumaker",
    github: [{ label: "Source", href: "https://github.com/N0rrtthh/ResuMaker" }],
    live: { label: "Live site", href: "https://n0rrtthh.github.io/ResuMaker/" },
  },
  {
    /* DRAFT — not shown until you fill in verified details and set
       published: true. Nothing here is published yet. */
    slug: "geopalay",
    name: "GeoPalay",
    kind: "Mobile GIS app",
    year: "",
    published: false,
    problem: "A mobile GIS application for rice field measurement and land-efficiency analysis.",
    contribution: "",
    tech: [],
    features: [],
    details: { role: "", implementation: [], challenges: [], outcome: [] },
  },
];

/** Smaller builds listed under the featured projects. */
export const otherWork: { name: string; what: string; tech: string; href?: string }[] = [
  { name: "JasFocus", what: "Productivity timer with automatic task progression", tech: "React · Vite · Tailwind", href: "https://n0rrtthh.github.io/JasFocus/" },
  { name: "WaveLength", what: "Anonymous real-time chat", tech: "JavaScript · Supabase", href: "https://n0rrtthh.github.io/WaveLength/" },
  { name: "Neon Smash", what: "Arcade game", tech: "Python · Pygame", href: "https://github.com/N0rrtthh/Neon-Smash" },
];

export type Cert = { title: string; issuer: string; year: string; href: string; featured?: boolean };

/* featured: true → shown up front; the rest sit behind "Show all". */
export const certifications: Cert[] = [
  { title: "AI Fundamentals: Foundations for Understanding AI", issuer: "Cisco · IBM SkillsBuild", year: "2026", href: "https://www.credly.com/badges/c701bfe8-fd85-476f-ac93-e8d13045da5a/public_url", featured: true },
  { title: "Enterprise Design Thinking Practitioner", issuer: "IBM SkillsBuild", year: "2026", href: "https://www.credly.com/badges/0cfc014b-0986-48e3-892c-54c639a9ab0e/public_url", featured: true },
  { title: "Ethical Hacker", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/a4a574a4-2c88-43c3-97fa-6d867e815055/public_url", featured: true },
  { title: "JavaScript Essentials 1 & 2", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/f103bf83-5b0e-41fe-a99b-0d79489d62e3/public_url", featured: true },
  { title: "AI Fundamentals: Language and Vision in AI", issuer: "Cisco · IBM SkillsBuild", year: "2026", href: "https://www.credly.com/badges/0ddb7bbf-1c2d-4378-bbc5-c5d373f05d30/public_url" },
  { title: "Python Essentials 1 & 2", issuer: "Cisco Networking Academy · OpenEDG", year: "2026", href: "https://www.credly.com/badges/c7a050c7-62e9-4220-84c2-88fbc1afdf85/public_url" },
  { title: "Data Science Essentials with Python", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/664f0975-7c01-47fc-8a96-43bba8690442/public_url" },
  { title: "Data Analytics Essentials", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/df779424-ba5e-4387-8335-44607c053587/public_url" },
  { title: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/f53ca562-b7a5-4723-817b-d348547b1ab2/public_url" },
  { title: "C++ Essentials 1, 2 & C++ Advanced", issuer: "Cisco Networking Academy · C++ Institute", year: "2026", href: "https://www.credly.com/badges/d5e9426a-1029-4ed6-b1fd-51f8a0c6a41c/public_url" },
  { title: "HTML Essentials", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/7670e2fe-10c0-45c8-a680-cde94bf45d7f/public_url" },
  { title: "CSS Essentials", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/4f7f4a03-37d9-4b2a-96c0-09acdf694362/public_url" },
  { title: "Introduction to Modern AI", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/d7387b6f-148b-421d-9a08-46560784b0cb/public_url" },
  { title: "Introduction to IoT and Digital Transformation", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/85504c74-946a-46eb-a293-028044350480/public_url" },
  { title: "Operating Systems Support", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/f39b2e79-5f07-4ea0-aeb3-e574befbb40a/public_url" },
  { title: "Hardware and Upgrade Support", issuer: "Cisco Networking Academy", year: "2026", href: "https://www.credly.com/badges/1050e0bf-c6cb-4c56-baf1-1ec43dc4d50b/public_url" },
];

/** Total credential count mentioned in the certifications block. */
export const certificationTotal = 29;
