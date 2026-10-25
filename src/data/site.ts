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
    period: "Aug 2025 – Sep 2025",
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
    problem: "Most resume builders are paywalled or ignore what gets past applicant tracking systems.",
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
    slug: "creative-portfolio",
    name: "A Creative Portfolio",
    kind: "Creative portfolio website",
    year: "2024",
    published: true,
    problem: "",
    contribution: "Designed and built solo.",
    tech: ["HTML", "CSS", "JavaScript"],
    features: [],
    details: { role: "", implementation: [], challenges: [], outcome: [] },
    image: "creative-portfolio",
    live: { label: "Live site", href: "https://n0rrtthh.github.io/Portfolio-Creative-Website/" },
  },
  {
    slug: "north",
    name: "NORTH",
    kind: "Web portfolio for motion graphics and animation",
    year: "2022",
    published: true,
    problem: "",
    contribution: "This is my first portfolio website, built solo to showcase my motion graphics and animation work.",
    tech: ["HTML", "CSS", "JavaScript"],
    features: [],
    details: { role: "", implementation: [], challenges: [], outcome: [] },
    image: "north",
    live: { label: "Live site", href: "https://n0rrtthh.github.io/NORTH/" },
  },

];

/** Smaller builds listed under the featured projects. */
export const otherWork: { name: string; what: string; tech: string; href?: string }[] = [
  { name: "JasFocus", what: "Productivity timer with automatic task progression", tech: "React · Vite · Tailwind", href: "https://n0rrtthh.github.io/JasFocus/" },
  { name: "WaveLength", what: "Anonymous real-time chat", tech: "JavaScript · Supabase", href: "https://n0rrtthh.github.io/WaveLength/" },
  { name: "Neon Smash", what: "An Arcade game made in python", tech: "Python · Pygame", href: "https://github.com/N0rrtthh/Neon-Smash" },
  { name: "SchedEase", what: "A Classroom scheduling system prototype", tech: "Figma", href: "https://figma.fun/1LmgU7" },
  { name: "Quest of the Adventure Land", what: "A Platformer game developed in GDevelop", tech: "GDevelop", href: "https://shorturl.at/4yaOr" },
];

export type Cert = { title: string; issuer: string; year: string; href: string; verify: "Credly" | "Certificate"; featured?: boolean };

/* All 29, one entry per credential. featured: true → shown up front; the
   rest sit behind "Show more". `verify` names what the link opens. */
export const certifications: Cert[] = [
  { title: "AI Fundamentals: Foundations for Understanding AI", issuer: "Cisco · IBM SkillsBuild · DICT-ITU · DICT ILCDB", year: "2026", href: "https://www.credly.com/badges/c701bfe8-fd85-476f-ac93-e8d13045da5a/public_url", verify: "Credly", featured: true },
  { title: "Enterprise Design Thinking Practitioner", issuer: "IBM SkillsBuild", year: "2026", href: "https://www.credly.com/badges/0cfc014b-0986-48e3-892c-54c639a9ab0e/public_url", verify: "Credly", featured: true },
  { title: "Ethical Hacker", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/a4a574a4-2c88-43c3-97fa-6d867e815055/public_url", verify: "Credly", featured: true },
  { title: "JavaScript Essentials 2", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/f103bf83-5b0e-41fe-a99b-0d79489d62e3/public_url", verify: "Credly", featured: true },
  { title: "AI Fundamentals: Language and Vision in AI", issuer: "Cisco · IBM SkillsBuild · DICT-ITU · DICT ILCDB", year: "2026", href: "https://www.credly.com/badges/0ddb7bbf-1c2d-4378-bbc5-c5d373f05d30/public_url", verify: "Credly" },
  { title: "Introduction to Modern AI", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/d7387b6f-148b-421d-9a08-46560784b0cb/public_url", verify: "Credly" },
  { title: "Apply AI: Update Your Resume", issuer: "Cisco · DICT-ITU · DICT ILCDB", year: "2026", href: "https://www.credly.com/badges/e0cc3f70-ed75-40fb-af86-7f20d0348efa/public_url", verify: "Credly" },
  { title: "Data Science Essentials with Python", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/664f0975-7c01-47fc-8a96-43bba8690442/public_url", verify: "Credly" },
  { title: "Data Analytics Essentials", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/df779424-ba5e-4387-8335-44607c053587/public_url", verify: "Credly" },
  { title: "Introduction to Data Science", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/3b678f36-573e-40f7-b63e-607209028634/public_url", verify: "Credly" },
  { title: "Introduction to Cybersecurity", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/f53ca562-b7a5-4723-817b-d348547b1ab2/public_url", verify: "Credly" },
  { title: "Python Essentials 1", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/fdcaaeb7-c1ee-4b6b-8771-89d6f2e4da00/public_url", verify: "Credly" },
  { title: "Digital Safety and Security Awareness", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/4f4c6e8e-1659-4ea3-aa28-df59e2235a10/public_url", verify: "Credly" },
  { title: "Python Essentials 2", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/c7a050c7-62e9-4220-84c2-88fbc1afdf85/public_url", verify: "Credly" },
  { title: "C++ Essentials 1", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/eed4b2be-12c7-4a58-b480-a13e9277273c/public_url", verify: "Credly" },
  { title: "C++ Essentials 2", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/58418359-fd28-4e2f-a0eb-37b9d9f5e978/public_url", verify: "Credly" },
  { title: "C++ Advanced", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/d5e9426a-1029-4ed6-b1fd-51f8a0c6a41c/public_url", verify: "Credly" },
  { title: "JavaScript Essentials 1", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/c4666247-e181-4ddd-b471-edae5c987e62/public_url", verify: "Credly" },
  { title: "HTML Essentials", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/7670e2fe-10c0-45c8-a680-cde94bf45d7f/public_url", verify: "Credly" },
  { title: "CSS Essentials", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/4f7f4a03-37d9-4b2a-96c0-09acdf694362/public_url", verify: "Credly" },
  { title: "Introduction to IoT and Digital Transformation", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/85504c74-946a-46eb-a293-028044350480/public_url", verify: "Credly" },
  { title: "Hardware and Upgrade Support", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/1050e0bf-c6cb-4c56-baf1-1ec43dc4d50b/public_url", verify: "Credly" },
  { title: "Operating Systems Support", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/f39b2e79-5f07-4ea0-aeb3-e574befbb40a/public_url", verify: "Credly" },
  { title: "Discovering Entrepreneurship", issuer: "Cisco · DICT-ITU", year: "2026", href: "https://www.credly.com/badges/8c470820-13ea-4385-8e62-ff40ebcd594f/public_url", verify: "Credly" },
  { title: "Data Analytics: Your Game-Changer for 2025", issuer: "UniAthena", year: "2025", href: "https://pdfhost.io/v/UB2w3V3fDH_Data_Analytics__Your_Game-Changer_for_2025", verify: "Certificate" },
  { title: "MS Excel: For Real World Office Productivity", issuer: "DataSense Analytics", year: "2026", href: "https://pdfhost.io/v/FMZWnrgzxw_MS_Excel__For_Real_World_Office_Productivity", verify: "Certificate" },
  { title: "Cybersecurity for SMEs: Protecting Your Business From Cyber Threats", issuer: "DICT Caraga", year: "2025", href: "https://pdfhost.io/v/7bUsJJLEpN_Cybersecurity_for_Small_and_Medium_Enterprises__SMEs___Protecting_Your_Business_From_Cyber_Threats", verify: "Certificate" },
  { title: "Digital Marketing for Startups and MSMEs using AI", issuer: "DICT Caraga", year: "2025", href: "https://pdfhost.io/v/YJa5arskM8_Digital_Marketing_for_Startups_and_MSMEs_using_AI", verify: "Certificate" },
  { title: "Module 4 - Object Oriented Programming", issuer: "CvSU × Universiti Teknologi MARA", year: "2025", href: "https://pdfhost.io/v/PwVgsvxpHE_Module_4_-_Object_Oriented_Programming", verify: "Certificate" },
];

/** Total credential count mentioned in the certifications block. */
export const certificationTotal = certifications.length;
