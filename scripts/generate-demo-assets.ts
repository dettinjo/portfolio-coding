/**
 * Generates the committed demo / template dataset under `demo/`.
 *
 * The demo dataset is what the build serves when there is no GitHub token
 * (clean clone or `PORTFOLIO_DEMO=1`) so a public live demo renders a full,
 * realistic site. It rides on the existing local-projects loader in
 * scripts/fetch-portfolio.ts (`<dir>/.portfolio/{metadata.json,about.*.md,
 * cover.*,gallery/}` + `metadata.languages` for skill scoring).
 *
 * This script is the single source of truth for the demo content AND its
 * imagery: it writes the text files and renders on-brand SVG→webp mockups
 * (no real photos, zero copyright risk). Run once; the output under `demo/`
 * is committed. Re-run to regenerate:  `npx tsx scripts/generate-demo-assets.ts`
 */
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const rootDir = path.join(__dirname, "..");
const demoDir = path.join(rootDir, "demo");
const projectsDir = path.join(demoDir, "projects");

// ─── helpers ────────────────────────────────────────────────────────────────
const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const writeFile = (p: string, content: string) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
};

const toWebp = async (svg: string, dest: string) => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(dest);
};

// Deterministic pseudo-random from a string seed, so variants differ but builds
// are reproducible.
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shade = (hex: string, pct: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + pct));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + pct));
  const b = Math.min(255, Math.max(0, (n & 255) + pct));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ─── mockup styles ───────────────────────────────────────────────────────────
const W = 1280;
const H = 800;

function browserChrome(inner: string, accent: string, label: string) {
  return `
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="18" fill="#0F1115" stroke="#ffffff14"/>
  <rect x="40" y="40" width="${W - 80}" height="56" rx="18" fill="#171A20"/>
  <rect x="40" y="78" width="${W - 80}" height="18" fill="#171A20"/>
  <circle cx="74" cy="68" r="7" fill="#ff5f57"/><circle cx="98" cy="68" r="7" fill="#febc2e"/><circle cx="122" cy="68" r="7" fill="#28c840"/>
  <rect x="170" y="54" width="${W - 320}" height="28" rx="14" fill="#0F1115"/>
  <text x="190" y="73" font-family="${MONO}" font-size="15" fill="#ffffff55">${esc(label)}</text>
  ${inner}`;
}

function dashboardMock(title: string, sub: string, accent: string, seed: string) {
  const r = seeded(seed);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const bh = 60 + Math.floor(r() * 150);
    return `<rect x="${740 + i * 64}" y="${560 - bh}" width="38" height="${bh}" rx="6" fill="${i % 2 ? accent : shade(accent, -40)}" opacity="${0.55 + r() * 0.45}"/>`;
  }).join("");
  const kpis = ["Revenue", "Active", "Latency"].map((k, i) => `
    <rect x="${720 + i * 168}" y="150" width="150" height="92" rx="12" fill="#171A20" stroke="#ffffff10"/>
    <text x="${736 + i * 168}" y="180" font-family="${FONT}" font-size="14" fill="#ffffff60">${k}</text>
    <text x="${736 + i * 168}" y="214" font-family="${FONT}" font-size="26" font-weight="700" fill="#FAFAFA">${["$48.2k","2,940","38ms"][i]}</text>`).join("");
  const rows = Array.from({ length: 5 }, (_, i) => `
    <rect x="92" y="${300 + i * 46}" width="${r() > 0.5 ? 480 : 560}" height="14" rx="7" fill="#ffffff${i === 0 ? "30" : "16"}"/>
    <circle cx="${600}" cy="${307 + i * 46}" r="9" fill="${accent}" opacity="${0.8 - i * 0.12}"/>`).join("");
  const inner = `
    <rect x="40" y="96" width="220" height="${H - 136}" fill="#13161B"/>
    <rect x="72" y="140" width="120" height="16" rx="8" fill="${accent}"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="72" y="${190 + i * 44}" width="${140 - i * 8}" height="12" rx="6" fill="#ffffff${i === 1 ? "40" : "1c"}"/>`).join("")}
    <text x="92" y="140" font-family="${FONT}" font-size="30" font-weight="800" fill="#FAFAFA">${esc(title)}</text>
    <text x="92" y="170" font-family="${FONT}" font-size="16" fill="#ffffff66">${esc(sub)}</text>
    ${kpis}${rows}
    <rect x="720" y="270" width="468" height="300" rx="14" fill="#13161B" stroke="#ffffff10"/>
    <text x="740" y="305" font-family="${FONT}" font-size="15" fill="#ffffff70">Throughput</text>
    ${bars}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0A0B0E"/>${browserChrome(inner, accent, sub.toLowerCase().replace(/\s+/g, "") + ".app")}</svg>`;
}

function codeMock(title: string, sub: string, accent: string, seed: string) {
  const r = seeded(seed);
  const kw = "#C792EA", str = "#C3E88D", fn = accent, com = "#5c6370", txt = "#abb2bf";
  const lines = [
    [["import", kw], [" { ", txt], ["Router", fn], [" } from ", txt], ["'express'", str]],
    [],
    [["export", kw], [" const ", txt], ["api", fn], [" = ", txt], ["Router", fn], ["()", txt]],
    [["api", fn], [".", txt], ["get", kw], ["(", txt], ["'/health'", str], [", ", txt], ["(req, res) =>", txt], [" {", txt]],
    [["  res", txt], [".", txt], ["json", fn], ["({ ", txt], ["status", txt], [": ", txt], ["'ok'", str], [" })", txt]],
    [["})", txt]],
    [],
    [["// ", com], ["validate + rate-limit middleware", com]],
    [["api", fn], [".", txt], ["use", kw], ["(", txt], ["auth", fn], [", ", txt], ["limiter", fn], [")", txt]],
  ];
  const code = lines.map((toks, i) => {
    let x = 240;
    const spans = toks.map((t) => {
      const s = `<text x="${x}" y="${158 + i * 38}" font-family="${MONO}" font-size="19" fill="${t[1]}">${esc(t[0])}</text>`;
      x += t[0].length * 11;
      return s;
    }).join("");
    return `<text x="190" y="${158 + i * 38}" font-family="${MONO}" font-size="17" fill="#3b4048">${i + 1}</text>${spans}`;
  }).join("");
  const inner = `
    <rect x="40" y="96" width="150" height="${H - 136}" fill="#13161B"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="64" y="${150 + i * 40}" width="${100 - (r() * 30) | 0}" height="11" rx="5" fill="#ffffff${i === 2 ? "44" : "18"}"/>`).join("")}
    ${code}
    <rect x="190" y="${H - 88}" width="${W - 230}" height="40" fill="#13161B"/>
    <circle cx="214" cy="${H - 68}" r="5" fill="${accent}"/>
    <text x="232" y="${H - 63}" font-family="${MONO}" font-size="14" fill="#ffffff66">${esc(title)} — main ✓ build passing</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0A0B0E"/>${browserChrome(inner, accent, sub.toLowerCase().replace(/\s+/g, "-") + ".ts")}</svg>`;
}

function terminalMock(title: string, sub: string, accent: string, seed: string) {
  const r = seeded(seed);
  const lines = [
    [`$ terraform apply`, "#ffffffaa"],
    [`module.network.azurerm_resource_group.main: Creating...`, "#7f8896"],
    [`module.cluster.azurerm_kubernetes_cluster.aks: Still creating... [30s]`, "#7f8896"],
    [`module.cluster.helm_release.ingress_nginx: Creation complete ✓`, "#9ccc65"],
    [`module.cluster.kubernetes_namespace.app: Creation complete ✓`, "#9ccc65"],
    [`cert-manager.io/clusterissuer/letsencrypt: configured ✓`, "#9ccc65"],
    [``, "#fff"],
    [`Apply complete! Resources: 14 added, 0 changed, 0 destroyed.`, accent],
    [`$ kubectl get pods -n app`, "#ffffffaa"],
    [`web-7c9f   2/2   Running   0   12s`, "#7f8896"],
    [`api-5d4b   2/2   Running   0   12s`, "#7f8896"],
  ];
  const body = lines.map((l, i) => `<text x="86" y="${168 + i * 40}" font-family="${MONO}" font-size="19" fill="${l[1]}">${esc(l[0])}</text>`).join("");
  const inner = `
    <text x="86" y="138" font-family="${FONT}" font-size="22" font-weight="700" fill="#FAFAFA">${esc(title)}</text>
    <text x="${W - 90}" y="138" text-anchor="end" font-family="${MONO}" font-size="15" fill="#ffffff55">${esc(sub)}</text>
    ${body}
    <rect x="86" y="${168 + lines.length * 40 - 14}" width="13" height="22" fill="${accent}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0A0B0E"/>${browserChrome(inner, accent, "~/infra — zsh")}</svg>`;
}

function chatMock(title: string, sub: string, accent: string, seed: string) {
  const r = seeded(seed);
  const msgs = [
    ["Is the Eiffel Tower taller than the Statue of Liberty?", false],
    ["Yes. The Eiffel Tower is 330 m; the Statue of Liberty is 93 m.", true],
    ["Verified against 2 sources · confidence 0.98", true],
  ];
  let y = 150;
  const bubbles = msgs.map((m, i) => {
    const user = !m[1];
    const w = 520;
    const x = user ? W - 120 - w : 240;
    const fill = user ? "#1b1f27" : shade(accent, -70);
    const h = i === 1 ? 92 : 64;
    const b = `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${user ? "#ffffff12" : accent}" stroke-opacity="${user ? 1 : 0.5}"/>
      <text x="${x + 22}" y="${y + 38}" font-family="${FONT}" font-size="18" fill="${i === 2 ? "#ffffff66" : "#E6E6E6"}">${esc((m[0] as string).slice(0, 46))}</text>
      ${(m[0] as string).length > 46 ? `<text x="${x + 22}" y="${y + 64}" font-family="${FONT}" font-size="18" fill="#E6E6E6">${esc((m[0] as string).slice(46))}</text>` : ""}`;
    y += h + 24;
    return b;
  }).join("");
  const inner = `
    <rect x="40" y="96" width="180" height="${H - 136}" fill="#13161B"/>
    <text x="92" y="138" font-family="${FONT}" font-size="22" font-weight="700" fill="#FAFAFA">${esc(title)}</text>
    <text x="92" y="166" font-family="${FONT}" font-size="15" fill="#ffffff66">${esc(sub)}</text>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="64" y="${190 + i * 40}" width="${130 - i * 14}" height="11" rx="5" fill="#ffffff${i === 0 ? "40" : "18"}"/>`).join("")}
    ${bubbles}
    <rect x="240" y="${H - 96}" width="${W - 380}" height="48" rx="24" fill="#13161B" stroke="#ffffff14"/>
    <text x="266" y="${H - 66}" font-family="${FONT}" font-size="16" fill="#ffffff44">Ask anything…</text>
    <circle cx="${W - 168}" cy="${H - 72}" r="20" fill="${accent}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0A0B0E"/>${browserChrome(inner, accent, "fact-auditor")}</svg>`;
}

const MW = 1200;
const MH = 900;
function mobileMock(title: string, sub: string, accent: string, seed: string, variant: number) {
  const r = seeded(seed);
  const px = (MW - 430) / 2;
  const py = 40;
  const pw = 430;
  const ph = 820;
  let screen = "";
  if (variant === 0) {
    // map view
    const pins = Array.from({ length: 5 }, (_, i) => `<circle cx="${px + 70 + r() * 300}" cy="${py + 230 + r() * 360}" r="10" fill="${accent}" stroke="#fff" stroke-width="2"/>`).join("");
    screen = `
      <rect x="${px + 16}" y="${py + 110}" width="${pw - 32}" height="${ph - 240}" fill="#1a2733"/>
      ${Array.from({ length: 7 }, (_, i) => `<line x1="${px + 16}" y1="${py + 160 + i * 90}" x2="${px + pw - 16}" y2="${py + 160 + i * 90}" stroke="#ffffff0e"/>`).join("")}
      <path d="M ${px + 40} ${py + 600} Q ${px + 200} ${py + 400} ${px + pw - 50} ${py + 250}" stroke="${accent}" stroke-width="6" fill="none" opacity="0.8"/>
      ${pins}
      <rect x="${px + 16}" y="${py + ph - 130}" width="${pw - 32}" height="114" rx="16" fill="#11161c"/>
      <text x="${px + 40}" y="${py + ph - 92}" font-family="${FONT}" font-size="22" font-weight="700" fill="#fff">Alpine Loop · 8.2 km</text>
      <text x="${px + 40}" y="${py + ph - 60}" font-family="${FONT}" font-size="17" fill="#ffffff77">+640 m · ~3h 10m</text>`;
  } else {
    // list / finance
    const rows = Array.from({ length: 6 }, (_, i) => `
      <rect x="${px + 24}" y="${py + 200 + i * 96}" width="${pw - 48}" height="76" rx="14" fill="#141a22"/>
      <circle cx="${px + 64}" cy="${py + 238 + i * 96}" r="20" fill="${shade(accent, -30)}" opacity="0.6"/>
      <rect x="${px + 98}" y="${py + 220 + i * 96}" width="150" height="13" rx="6" fill="#ffffff44"/>
      <rect x="${px + 98}" y="${py + 246 + i * 96}" width="96" height="11" rx="5" fill="#ffffff1f"/>
      <text x="${px + pw - 44}" y="${py + 244 + i * 96}" text-anchor="end" font-family="${MONO}" font-size="18" fill="${i % 3 ? "#9ccc65" : "#ff7a90"}">${i % 3 ? "+" : "−"}€${(20 + r() * 200).toFixed(0)}</text>`).join("");
    screen = `
      <text x="${px + 28}" y="${py + 150}" font-family="${FONT}" font-size="30" font-weight="800" fill="#fff">€ 2,480.50</text>
      <text x="${px + 28}" y="${py + 180}" font-family="${FONT}" font-size="15" fill="#ffffff66">Balance · this month</text>
      ${rows}`;
  }
  const phone = `
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="52" fill="#0c0e12" stroke="#23262d" stroke-width="3"/>
    <rect x="${px + 8}" y="${py + 8}" width="${pw - 16}" height="${ph - 16}" rx="46" fill="#0F1115"/>
    <rect x="${px + pw / 2 - 60}" y="${py + 18}" width="120" height="26" rx="13" fill="#0c0e12"/>
    <text x="${px + 28}" y="${py + 90}" font-family="${FONT}" font-size="26" font-weight="800" fill="${accent}">${esc(title)}</text>
    <text x="${px + 28}" y="${py + 118}" font-family="${FONT}" font-size="14" fill="#ffffff66">${esc(sub)}</text>
    ${screen}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}" viewBox="0 0 ${MW} ${MH}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(accent, -120)}"/><stop offset="1" stop-color="#0A0B0E"/></linearGradient></defs>
    <rect width="${MW}" height="${MH}" fill="url(#bg)"/>${phone}</svg>`;
}

function renderShot(style: string, title: string, sub: string, accent: string, seed: string, variant: number): string {
  switch (style) {
    case "dashboard": return dashboardMock(title, sub, accent, seed);
    case "code": return codeMock(title, sub, accent, seed);
    case "terminal": return terminalMock(title, sub, accent, seed);
    case "chat": return chatMock(title, sub, accent, seed);
    case "mobile": return mobileMock(title, sub, accent, seed, variant % 2);
    default: return dashboardMock(title, sub, accent, seed);
  }
}

// A simple contact silhouette on a TRANSPARENT background, in a neutral gray that
// reads on both the light page and the theme-inverted (foreground) avatar circle.
// This lets the hero's themed/scroll-inverting circular background show through,
// matching the real site's behavior (no real photo in the demo).
function avatarSvg(): string {
  const gray = "#9aa1ab";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
    <circle cx="320" cy="250" r="118" fill="${gray}"/>
    <path d="M132 612 C132 452 236 392 320 392 C404 392 508 452 508 612 Z" fill="${gray}"/>
  </svg>`;
}

// ─── demo content ─────────────────────────────────────────────────────────────
type Demo = {
  slug: string;
  style: string;
  accent: string;
  developedAt: string;
  weight: number;
  publishLink: boolean;
  repoUrl: string | null;
  liveUrl: string | null;
  title: string;
  titleDe: string;
  projectType: string;
  projectTypeDe: string;
  description: string;
  descriptionDe: string;
  tags: string[];
  languages: Record<string, number>;
  features: string[];
  featuresDe: string[];
  shotLabels: string[];
};

// NOTE: a deliberately *different* tech stack from the template author's own —
// Vue/Nuxt, Go, Flutter, Ansible/AWS, TensorFlow, Rails — to demonstrate that
// icons resolve dynamically from devicon and tech links resolve from the registry
// for technologies the author never used. No project has a real repo, so none
// declare a repoUrl (the detail page hides the source link when absent).
const DEMOS: Demo[] = [
  {
    slug: "aurora-dashboard",
    style: "dashboard",
    accent: "#6366F1",
    developedAt: "2025-02-18",
    weight: 2,
    publishLink: false,
    repoUrl: null,
    liveUrl: "https://aurora.example.com",
    title: "Aurora Analytics Dashboard",
    titleDe: "Aurora Analytics-Dashboard",
    projectType: "Frontend Web Application",
    projectTypeDe: "Frontend-Webanwendung",
    description:
      "A real-time analytics dashboard with live charts, theming and a fully keyboard-accessible UI, built with Nuxt.",
    descriptionDe:
      "Ein Echtzeit-Analyse-Dashboard mit Live-Charts, Theming und vollständig tastaturbedienbarer Oberfläche – gebaut mit Nuxt.",
    tags: ["Vue.js", "Nuxt", "Vuetify", "Sass", "Vite"],
    languages: { JavaScript: 90000 },
    features: [
      "Server-rendered Vue with Nuxt and a composable store",
      "Light/dark theming driven by Sass design tokens",
      "Reactive, virtualized data tables (60fps on 10k rows)",
      "Lightning-fast HMR and builds with Vite",
    ],
    featuresDe: [
      "Server-gerendertes Vue mit Nuxt und einem Composable-Store",
      "Hell/Dunkel-Theming über Sass-Design-Tokens",
      "Reaktive, virtualisierte Datentabellen (60fps bei 10k Zeilen)",
      "Blitzschnelles HMR und Builds mit Vite",
    ],
    shotLabels: ["Overview", "Reports", "Settings"],
  },
  {
    slug: "nimbus-api",
    style: "code",
    accent: "#10B981",
    developedAt: "2024-09-05",
    weight: 2,
    publishLink: false,
    repoUrl: null,
    liveUrl: null,
    title: "Nimbus Go Microservice API",
    titleDe: "Nimbus Go-Microservice-API",
    projectType: "Backend / API",
    projectTypeDe: "Backend / API",
    description:
      "A high-throughput Go API with a GraphQL gateway, PostgreSQL persistence and Redis-backed caching and queues.",
    descriptionDe:
      "Eine durchsatzstarke Go-API mit GraphQL-Gateway, PostgreSQL-Persistenz und Redis-gestütztem Caching und Queues.",
    tags: ["Go", "PostgreSQL", "Redis", "RabbitMQ", "GraphQL"],
    languages: { Go: 88000 },
    features: [
      "Idiomatic Go services with context-based cancellation",
      "GraphQL gateway over a normalized PostgreSQL schema",
      "Redis caching + RabbitMQ work queues for async jobs",
      "Load-tested to 20k req/s with graceful shutdown",
    ],
    featuresDe: [
      "Idiomatische Go-Services mit Context-basiertem Cancellation",
      "GraphQL-Gateway über ein normalisiertes PostgreSQL-Schema",
      "Redis-Caching + RabbitMQ-Work-Queues für Async-Jobs",
      "Lasttest bis 20k req/s mit Graceful Shutdown",
    ],
    shotLabels: ["Handlers", "Schema", "CI"],
  },
  {
    slug: "trailmark-app",
    style: "mobile",
    accent: "#14B8A6",
    developedAt: "2023-06-22",
    weight: 1,
    publishLink: false,
    repoUrl: null,
    liveUrl: null,
    title: "TrailMark — Cross-Platform Hiking App",
    titleDe: "TrailMark — Plattformübergreifende Wander-App",
    projectType: "Cross-Platform Mobile App",
    projectTypeDe: "Plattformübergreifende Mobile App",
    description:
      "A Flutter hiking app with offline maps, live GPS tracking and Firebase sync across iOS and Android.",
    descriptionDe:
      "Eine Flutter-Wander-App mit Offline-Karten, Live-GPS-Tracking und Firebase-Sync über iOS und Android.",
    tags: ["Flutter", "Dart", "Firebase"],
    languages: { Dart: 90000 },
    features: [
      "Single Flutter codebase for iOS and Android",
      "Offline vector maps with live route recording",
      "Firebase auth + Firestore sync across devices",
      "Custom animations driven by Dart's async streams",
    ],
    featuresDe: [
      "Eine Flutter-Codebasis für iOS und Android",
      "Offline-Vektorkarten mit Live-Routenaufzeichnung",
      "Firebase-Auth + Firestore-Sync über alle Geräte",
      "Eigene Animationen über Darts Async-Streams",
    ],
    shotLabels: ["Map", "Track", "Saved"],
  },
  {
    slug: "helmforge-platform",
    style: "terminal",
    accent: "#F59E0B",
    developedAt: "2025-03-30",
    weight: 2,
    publishLink: false,
    repoUrl: null,
    liveUrl: null,
    title: "HelmForge — Cloud Provisioning Platform",
    titleDe: "HelmForge — Cloud-Provisioning-Plattform",
    projectType: "DevOps / Infrastructure",
    projectTypeDe: "DevOps / Infrastruktur",
    description:
      "Reproducible AWS infrastructure provisioned with Ansible, delivered through Jenkins pipelines with Prometheus + Grafana observability.",
    descriptionDe:
      "Reproduzierbare AWS-Infrastruktur via Ansible bereitgestellt, ausgeliefert über Jenkins-Pipelines mit Prometheus- und Grafana-Observability.",
    tags: ["Ansible", "Amazon Web Services", "Jenkins", "Prometheus", "Grafana"],
    languages: { Shell: 24000, Python: 12000 },
    features: [
      "Idempotent AWS provisioning with Ansible roles",
      "Jenkins pipelines with promote/rollback stages",
      "Prometheus metrics + Grafana dashboards and alerts",
      "One-command bootstrap and teardown",
    ],
    featuresDe: [
      "Idempotentes AWS-Provisioning mit Ansible-Rollen",
      "Jenkins-Pipelines mit Promote-/Rollback-Stufen",
      "Prometheus-Metriken + Grafana-Dashboards und Alerts",
      "Bootstrap und Teardown per Befehl",
    ],
    shotLabels: ["Provision", "Inventory", "Pipeline"],
  },
  {
    slug: "lexicon-ai",
    style: "chat",
    accent: "#8B5CF6",
    developedAt: "2024-12-12",
    weight: 2,
    publishLink: false,
    repoUrl: null,
    liveUrl: "https://lexicon.example.com",
    title: "Lexicon — NLP Classification Toolkit",
    titleDe: "Lexicon — NLP-Klassifikations-Toolkit",
    projectType: "AI / ML Application",
    projectTypeDe: "KI- / ML-Anwendung",
    description:
      "A text-classification toolkit: TensorFlow/Keras models trained on pandas pipelines, with scikit-learn baselines and Jupyter notebooks.",
    descriptionDe:
      "Ein Toolkit zur Textklassifikation: TensorFlow-/Keras-Modelle auf pandas-Pipelines trainiert, mit scikit-learn-Baselines und Jupyter-Notebooks.",
    tags: ["TensorFlow", "Keras", "scikit-learn", "Pandas", "NumPy", "Jupyter"],
    languages: { Python: 85000 },
    features: [
      "Keras models with reproducible training configs",
      "pandas/NumPy feature pipelines and scikit-learn baselines",
      "Experiment tracking and evaluation in Jupyter",
      "Precision/recall reporting with confusion matrices",
    ],
    featuresDe: [
      "Keras-Modelle mit reproduzierbaren Trainings-Konfigs",
      "pandas-/NumPy-Feature-Pipelines und scikit-learn-Baselines",
      "Experiment-Tracking und Auswertung in Jupyter",
      "Precision-/Recall-Auswertung mit Konfusionsmatrizen",
    ],
    shotLabels: ["Classify", "Dataset", "Metrics"],
  },
  {
    slug: "ledger-app",
    style: "dashboard",
    accent: "#F43F5E",
    developedAt: "2024-03-08",
    weight: 1,
    publishLink: false,
    repoUrl: null,
    liveUrl: null,
    title: "Ledger — Personal Finance",
    titleDe: "Ledger — Persönliche Finanzen",
    projectType: "Full-Stack Web App (private)",
    projectTypeDe: "Full-Stack-Webanwendung (privat)",
    description:
      "A private Ruby on Rails budgeting app with recurring transactions, category budgets and spending insights.",
    descriptionDe:
      "Eine private Ruby-on-Rails-Budget-App mit wiederkehrenden Buchungen, Kategorie-Budgets und Ausgaben-Insights.",
    tags: ["Ruby", "Ruby on Rails", "PostgreSQL", "Redis", "Sass"],
    languages: { Ruby: 70000 },
    features: [
      "Rails app with Hotwire for live, server-rendered updates",
      "Recurring transactions and per-category budgets",
      "Background jobs (Sidekiq + Redis) for imports",
      "Monthly spending insights and charts",
    ],
    featuresDe: [
      "Rails-App mit Hotwire für serverseitige Live-Updates",
      "Wiederkehrende Buchungen und Budgets pro Kategorie",
      "Background-Jobs (Sidekiq + Redis) für Importe",
      "Monatliche Ausgaben-Insights und Diagramme",
    ],
    shotLabels: ["Balance", "Budgets", "Reports"],
  },
];

function aboutMd(d: Demo, lang: "en" | "de"): string {
  const de = lang === "de";
  const desc = de ? d.descriptionDe : d.description;
  const feats = de ? d.featuresDe : d.features;
  const headings = de
    ? { ov: "Überblick", feat: "Funktionen", stack: "Tech-Stack", note: "Hinweis" }
    : { ov: "Overview", feat: "Features", stack: "Tech stack", note: "Note" };
  const grid = d.shotLabels
    .map((_, i) => `  <img src="/media/projects/${d.slug}/gallery/shot${i + 1}.webp" alt="${esc(d.title)} screenshot ${i + 1}" width="32%" />`)
    .join("\n");
  const note = d.publishLink
    ? ""
    : de
      ? `\n## ${headings.note}\n\nDies ist ein privates Projekt – der Quellcode ist nicht öffentlich verlinkt.\n`
      : `\n## ${headings.note}\n\nThis is a private project — the source code is not publicly linked.\n`;
  return `## ${headings.ov}

${desc}

<p align="center">
${grid}
</p>

## ${headings.feat}

${feats.map((f) => `- ${f}`).join("\n")}

## ${headings.stack}

${d.tags.join(" · ")}
${note}`;
}

// ─── site config + resume ─────────────────────────────────────────────────────
const SITE_CONFIG = {
  person: {
    fullName: "Alex Rivera",
    firstName: "Alex",
    headline: "Full-Stack Engineer",
    email: "hello@example.com",
    phone: "",
    address: { street: "", city: "Berlin", country: "Germany" },
    // Fictional demo persona. Handles point only at GitHub's official "octocat"
    // example account — never a real individual's profile. LinkedIn is omitted.
    socials: { github: "octocat", linkedin: "", instagram: "" },
  },
  site: {
    serverUrl: "https://portfolio-demo.example.com",
    defaultLocale: "en",
    seo: {
      description: {
        en: "Demo portfolio of Alex Rivera — a config-driven, GitHub-powered developer portfolio template.",
        de: "Demo-Portfolio von Alex Rivera — ein konfigurationsgesteuertes, GitHub-betriebenes Entwickler-Portfolio-Template.",
      },
    },
  },
  legal: {
    hosting: { provider: "GitHub Pages (demo)", address: "88 Colin P Kelly Jr St, San Francisco, CA 94107, USA" },
    analytics: { tool: "Umami", domain: "analytics.example.com", cookieless: true },
  },
  contact: { smtpFrom: "demo@example.com" },
};

const RESUME = {
  basics: {
    name: "Alex Rivera",
    headline: "Full-Stack Engineer",
    email: "hello@example.com",
    location: "Berlin, Germany",
    url: { href: "https://portfolio-demo.example.com" },
    picture: { url: "/images/profile.webp" },
  },
  display: { experience: 4, education: 3 },
  sections: {
    summary: {
      name: "Summary",
      visible: true,
      content:
        "Full-stack engineer who builds well-tested web apps and the cloud infrastructure to run them. Comfortable from Vue UIs to AWS provisioning.",
    },
    experience: {
      name: "Experience",
      visible: true,
      items: [
        { id: "e1", visible: true, company: "Northwind Labs", position: "Senior Full-Stack Engineer", date: "2023 — Present", location: "Berlin", summary: "Lead the web platform team; shipped a real-time analytics suite on Vue/Nuxt and a Go API serving 40M requests/day." },
        { id: "e2", visible: true, company: "Cloudpeak GmbH", position: "Software Engineer", date: "2021 — 2023", location: "Munich", summary: "Built CI/CD and AWS infrastructure as code; cut deploy times by 70% with Jenkins pipelines and Ansible." },
        { id: "e3", visible: true, company: "Freelance", position: "Mobile & Web Developer", date: "2019 — 2021", location: "Remote", summary: "Delivered Flutter apps and Rails backends for early-stage clients." },
      ],
    },
    education: {
      name: "Education",
      visible: true,
      items: [
        { id: "ed1", visible: true, institution: "TU Berlin", studyType: "M.Sc. Computer Science", area: "Distributed systems & machine learning", date: "2019 — 2021" },
        { id: "ed2", visible: true, institution: "University of Freiburg", studyType: "B.Sc. Computer Science", area: "Software engineering", date: "2016 — 2019" },
      ],
    },
    skills: {
      name: "Skills",
      visible: true,
      items: [
        { id: "s1", visible: true, name: "Vue.js / Nuxt", level: 5 },
        { id: "s2", visible: true, name: "Go / APIs", level: 5 },
        { id: "s3", visible: true, name: "Python / ML", level: 4 },
        { id: "s4", visible: true, name: "AWS / Ansible", level: 4 },
        { id: "s5", visible: true, name: "Flutter / Dart", level: 3 },
      ],
    },
    languages: {
      name: "Languages",
      visible: true,
      items: [
        { id: "l1", visible: true, name: "English", level: 5 },
        { id: "l2", visible: true, name: "German", level: 5 },
        { id: "l3", visible: true, name: "Spanish", level: 3 },
      ],
    },
    profiles: {
      name: "Profiles",
      visible: true,
      items: [
        { id: "p1", visible: true, network: "GitHub", username: "octocat", url: { href: "https://github.com/octocat" } },
      ],
    },
  },
};

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Generating demo dataset under demo/ …");

  for (const d of DEMOS) {
    const base = path.join(projectsDir, d.slug, ".portfolio");

    const metadata = {
      title: d.title,
      titleDe: d.titleDe,
      description: d.description,
      descriptionDe: d.descriptionDe,
      projectType: d.projectType,
      projectTypeDe: d.projectTypeDe,
      developedAt: `${d.developedAt}T00:00:00Z`,
      weight: d.weight,
      publishLink: d.publishLink,
      liveUrl: d.liveUrl,
      repoUrl: d.repoUrl,
      tags: d.tags,
      languages: d.languages,
    };
    writeFile(path.join(base, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n");
    writeFile(path.join(base, "about.en.md"), aboutMd(d, "en"));
    writeFile(path.join(base, "about.de.md"), aboutMd(d, "de"));

    // Cover (hero) + gallery shots.
    await toWebp(renderShot(d.style, d.title, d.shotLabels[0], d.accent, d.slug + "cover", 0), path.join(base, "cover.webp"));
    for (let i = 0; i < d.shotLabels.length; i++) {
      await toWebp(
        renderShot(d.style, d.title, d.shotLabels[i], d.accent, d.slug + i, i),
        path.join(base, "gallery", `shot${i + 1}.webp`)
      );
    }
    console.log(`  ✓ ${d.slug} (${d.shotLabels.length} shots)`);
  }

  // Avatar (transparent contact silhouette).
  await toWebp(avatarSvg(), path.join(demoDir, "profile.webp"));
  console.log("  ✓ profile.webp");

  // Config + resume.
  writeFile(path.join(demoDir, "site.config.json"), JSON.stringify(SITE_CONFIG, null, 2) + "\n");
  writeFile(path.join(demoDir, "resume.json"), JSON.stringify(RESUME, null, 2) + "\n");
  console.log("  ✓ site.config.json + resume.json");

  console.log("Demo dataset generated.");
}

main().catch((err) => {
  console.error("Failed to generate demo assets:", err);
  process.exit(1);
});
