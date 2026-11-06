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

import certificationData from "./certifications.json" with { type: "json" };

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
  /** A downloadable build, e.g. an Android APK. */
  download?: Link;
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
    slug: "pasado",
    name: "Pasado",
    kind: "Web app + Android app",
    year: "2026",
    published: true,
    problem:
      "Civil Service Exam reviewers are scattered PDFs and paid apps, and most don't work offline on the phones test-takers actually study on.",
    contribution: "One codebase I designed and built, shipped as an installable offline web app and as an Android app.",
    tech: ["JavaScript", "HTML", "CSS", "PWA", "Capacitor", "Android"],
    features: [
      "Timed mock exams in the CSE-PPT format for both Professional and Subprofessional levels",
      "Drills, flashcards, explanations for every answer, a study plan and math lessons played as a game",
      "Works offline: install it from the browser or get the Android app; progress stays on the device",
    ],
    details: {
      role: "Solo designer and developer.",
      implementation: [
        "A single vanilla JavaScript app with the question banks, lessons, exam hacks and the math game loaded as plain scripts.",
        "A build script packages it as an installable offline web app: a manifest plus a service worker that caches every file and refreshes on each release.",
        "The same build is wrapped with Capacitor for Android, adding haptics, daily reminder notifications and read-aloud.",
      ],
      challenges: [
        {
          challenge: "Shipping a web app and an Android app without maintaining two codebases.",
          approach: "Native features are detected at runtime, so the browser build and the APK run the same app code and the web version simply skips what it can't use.",
        },
      ],
      outcome: [],
    },
    image: "pasado",
    phoneImage: "pasado-mobile",
    github: [{ label: "Source", href: "https://github.com/N0rrtthh/Pasado---CSC-Exam-Reviewer" }],
    live: { label: "Web app", href: "https://n0rrtthh.github.io/Pasado---CSC-Exam-Reviewer/" },
    download: { label: "Android APK", href: "https://github.com/N0rrtthh/Pasado---CSC-Exam-Reviewer/releases/latest" },
  },
  {
    slug: "resumaker",
    name: "ResuMaker",
    kind: "Web app",
    year: "2026",
    published: true,
    problem: "Most resume builders are paywalled, and their previews crop or rescale the page, so you only see where it really breaks after exporting.",
    contribution: "Designed and built it solo: React, TypeScript and Vite, deployed with GitHub Actions.",
    tech: ["React", "TypeScript", "Vite", "pdf.js", "GitHub Actions"],
    features: [
      "True A4 / Letter page preview with automatic page breaks and one-click fit to one page",
      "Five ATS-friendly templates with a small set of design controls",
      "Built-in resume checklist, PDF and JSON import, text-based PDF export",
    ],
    details: {
      role: "Solo designer and developer.",
      implementation: [
        "React 19 + TypeScript + Vite single-page app; several resumes saved in the browser, with undo and redo.",
        "The resume is cut into blocks, measured at the real column width, and packed Word-style into real pages, so the preview is exactly what prints.",
        "PDF export runs through the browser's print engine at the exact paper size, so the file keeps selectable text and clickable links for applicant tracking systems.",
        "Continuous deployment to GitHub Pages through GitHub Actions.",
      ],
      challenges: [
        {
          challenge: "A resume preview that is scaled to fit the screen never shows where the pages actually break.",
          approach: "Headings are chained to the content after them and long jobs break between bullets, then everything is re-measured when web fonts finish loading.",
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

export type Cert = {
  title: string;
  issuer: string;
  year: string;
  href: string;
  verify: "Credly" | "Certificate";
  featured?: boolean;
  /** Optional remote badge image, used only when there is no local
      src/assets/badges/<slug>.webp for this title. */
  badge?: string;
};

/* Certifications live in ./certifications.json so the Cert Manager app can
   add, edit and reorder them through the GitHub API without touching code.
   featured: true → shown up front; the rest sit behind "Show more".
   `verify` names what the link opens. Array order is display order. */
export const certifications: Cert[] = certificationData as Cert[];


/** Total credential count mentioned in the certifications block. */
export const certificationTotal = certifications.length;
