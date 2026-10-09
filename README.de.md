<!-- portfolio:date=2025-06-01 -->

# Codebase — ein konfigurationsgesteuertes, GitHub-betriebenes Portfolio

**🌐 [English](README.md) · [Deutsch](README.de.md)**

Ein schnelles, SEO-optimiertes, zweisprachiges (EN/DE) Entwickler-Portfolio-
Template ganz ohne persönliche Daten im Repo — Projekte, Skills und Identität
werden zur Build-Zeit aus GitHub geladen.

Alles (Projekte, Skills, Lebenslauf, Identität, Rechtsseiten) wird zur Build-Zeit
aus deinen GitHub-Repositories und einem einzigen privaten Config-Repo erzeugt.
Die Anpassung an dein eigenes Portfolio bedeutet nur: ein Topic an deine Repos
vergeben und eine Config-Datei ausfüllen – ohne Code-Änderungen.

<p align="center">
  <img src="docs/screenshots/hero-light.webp" alt="Startseite / Hero-Bereich" width="49%" />
  <img src="docs/screenshots/hero-dark.webp" alt="Startseite im Dark Mode" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/projects-light.webp" alt="Projektbereich mit Suche & Filter" width="49%" />
  <img src="docs/screenshots/skills-dark.webp" alt="Skill-Raster im Dark Mode" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/project-detail-light.webp" alt="Projekt-Detailseite" width="49%" />
  <img src="docs/screenshots/resume-light.webp" alt="Lebenslauf-Seite" width="49%" />
</p>

> Die Screenshots stammen aus dem mitgelieferten **Demo-Datensatz** – keine
> echten Daten. Demo selbst starten mit `PORTFOLIO_DEMO=1 npm run build`.

---

## Funktionen

- **Konfigurationsgesteuert, keine persönlichen Daten im Repo.** Identität, SEO
  und der rechtliche Impressums-/Datenschutztext kommen aus einer einzigen
  `site.config.json`. Das veröffentlichte Template enthält nur generische
  Platzhalter.
- **GitHub-native Projektübernahme.** Ein Projekt ist jedes Repo mit dem Topic
  `portfolio` (mit Code-Link) oder `portfolio-private` (ohne Link). Die
  lokalisierte `README.md` / `README.de.md` wird zur Detailseite, die Beschreibung
  zum Karten-Überblick, die Topics zu den Tags. Keine Metadaten-Dateien pro Repo.
- **Vollständig zweisprachig (EN/DE)** über `next-intl`, mit lokalisierten Routen,
  Lebenslauf, Projektinhalten und `hreflang`-/Open-Graph-Metadaten.
- **Dynamische Tech-Icons.** Tags werden automatisch zu
  [devicon](https://devicon.dev)-Icons und Doku-Links aufgelöst (das komplette
  devicon-Manifest wird mit einer kleinen kuratierten Registry zusammengeführt),
  sodass neue Technologien ohne Konfiguration ein Icon erhalten.
- **Relevanz-sortierte Skills**, abgeleitet aus deinem echten Code (siehe unten).
- **Einheitliche Suche & Filter** – ein ausklappbares Bedienelement mit
  Kategorie-/Technologie-**Tokens**, ranggewichteter Autovervollständigung,
  Freitextsuche über alle Projektfelder, facettierter Filterung und
  clientseitiger **Paginierung**. Ein Klick auf einen Skill filtert die Projekte,
  die ihn verwenden.
- **Feine Animationen** – scrollgesteuerte, themeninvertierende Projektkarten und
  ein eigenes rAF-In-Page-Scrolling, das Layout-Verschiebungen (Hover, Filtern)
  übersteht, an denen natives Smooth-Scroll scheitern würde.
- **Rechtsseiten** (Impressum + Datenschutz) aus der Config erzeugt,
  **Kontaktformular** (SMTP) und optionale cookielose **Umami**-Analytics.
- **Statische Ausgabe** – alles wird zur Build-Zeit erzeugt; kein Laden zur
  Laufzeit, die Live-Site besteht nur aus statischen Dateien.
- **KI-nativer Model Context Protocol (MCP)-Server & Dokumentengenerator.**
  Integrierter `/api/mcp`-Endpunkt, der KI-Assistenten (Claude Desktop, Cursor,
  Antigravity) direkt mit deinem verifizierten Profil verbindet, um passgenaue,
  einseitige A4-Lebensläufe und DIN 5008-orientierte Anschreiben mit Pixel-perfektem
  PDF-Rendering (Puppeteer) und Web-Vorschauen zu erzeugen.
- **Minimalistisches Terminal LinkedIn-Banner-Studio & CLI-Generator.** Ein privates
  visuelles Studio (`/banner`) und Offline-CLI-Tool (`npm run banner`) zur Erstellung
  von Pixel-perfekten 1584×396px LinkedIn-Hintergrundbannern ohne störende Fensterrahmen,
  mit modularen Terminal-Bausteinen (Name, Rollentitel, Skills, Link, Statusline),
  smaragdfarbenen CLI-Prompts passend zur Hero-Section, Kollisionsschutz für das Profilbild und
  exakten Design-Tokens.
- **Mitgelieferter Demo-Datensatz**, damit ein frischer Clone (oder eine
  öffentliche Live-Demo) eine vollständige, realistische Site ohne Secrets zeigt.

---

## Wie Skill-Level & Relevanz berechnet werden

Zur Build-Zeit trägt jedes Projekt zu einem Score pro Technologie bei. Daraus
werden zwei Werte abgeleitet:

**1. Proficiency-Level (der 1–5-Balken):** ein kontinuierlicher Score wird pro
Technologie summiert und in Stufen eingeteilt.
- Eine **Sprache** trägt `(ihr Anteil an den Projekt-Bytes) × Projektgewicht` bei
  – nur Sprachen ≥ 5 % des Codes zählen.
- Ein **Framework-/Bibliotheks-/Tool-Tag** trägt das volle `Projektgewicht` bei.
- Ein optionaler `baseScore` pro Technologie kann das Ergebnis anpassen.
- Schwellen: `≥6 → 5`, `≥4 → 4`, `≥3 → 3`, `≥2 → 2`, sonst `1`.

**2. Relevanz (Sortierung innerhalb einer Kategorie, tiefer als das Level):**
sortiert die Skills und behält nur die **Top 12 pro Kategorie**, damit Kategorien
nicht unbegrenzt wachsen, wenn Projekte hinzukommen.

```
Relevanz = Tiefe              (der kontinuierliche Score oben)
         + Breite × 1.5       (Anzahl unterschiedlicher Projekte)
         + Aktualität × 2.0   (Aktualität = exp(−Jahre / 2), ~1,4 Jahre Halbwertszeit)
```

Eine kürzlich und in mehreren Projekten genutzte Technologie steht damit über
einer einmaligen von vor Jahren – selbst bei gleichem angezeigtem Level.

---

## Datenverarbeitung & Architektur

```
portfolio-config-Repo (privat, Topic: "portfolio-config")   ← der EINE Ort zum Personalisieren
  .portfolio/site.config.json   Identität, SEO, rechtliches Hosting/Analytics
  .portfolio/resume.json        Lebenslauf-Daten für die /resume-Seite
  .portfolio/profile.png        Avatar
  .portfolio/resume.pdf         herunterladbarer Lebenslauf (optional)
        │  (zur Build-Zeit geladen, nie in dieses Repo committet)
        ▼
dieses Template-Repo  ──►  npm run build  ──►  statische, personalisierte Site
        ▲
        │  Projekt-Repos: Topic "portfolio" (oder "portfolio-private") setzen
```

Zur Build-Zeit führt `scripts/fetch-portfolio.ts`:

1. Listet deine Repos und wählt die `portfolio` / `portfolio-private` aus; liest
   die lokalisierte README jedes Projekts (Bilder werden geladen & in WebP
   konvertiert), die Repo-Beschreibung und die Topics.
2. Löst die Personalisierung in dieser Reihenfolge auf: **Config-Repo**
   (automatisch über das `portfolio-config`-Topic erkannt) → lokales `config/` →
   committete `config/site.config.example.json` → mitgelieferter **Demo**-Datensatz.
3. Aggregiert die Skills (siehe oben) und schreibt
   `src/data/{projects,skills,resume,site.config}.json`.
4. Next.js baut daraus eine vollständig statische Site.

`src/lib/config.ts` stellt die aufgelöste Config als typisiertes `siteConfig`
bereit. Das Datum eines Repos lässt sich per HTML-Kommentar in dessen README
korrigieren: `<!-- portfolio:date=YYYY-MM-DD -->`.

**Datenschutz:** die generierten Daten (`src/data/*.json`), der Avatar, das
OG-Bild und die Projekt-Medien sind allesamt gitignored – sie gelangen nie in das
veröffentlichte Template.

---

## Einrichtung

```bash
cp .env.example .env.local        # GITHUB_TOKEN ergänzen (+ SMTP / Umami bei Bedarf)
npm install
npm run build                     # führt fetch-portfolio.ts und dann next build aus
npm run dev                       # http://localhost:3000
```

Ein `GITHUB_TOKEN` (Scope „repo“) erlaubt dem Build, deine Repos und das private
Config-Repo zu lesen. Ohne Token liefert der Build den **Demo-Datensatz**, sodass
ein frischer Clone immer eine vollständige Site erzeugt.

**Mach es zu deinem:**
1. Erstelle ein privates `portfolio-config`-Repo, vergib das `portfolio-config`-Topic
   und lege `.portfolio/site.config.json` (siehe
   [`config/site.config.example.json`](config/site.config.example.json)) +
   `resume.json` + `profile.png` an.
2. Vergib an ein Projekt-Repo das `portfolio`-Topic und gib ihm eine `README.md`
   (+ `README.de.md` für Deutsch). Weitere Topics werden zu Tech-Tags.
3. Neu bauen.

### Demo starten

```bash
PORTFOLIO_DEMO=1 npm run build && npm start
```

Liefert den committeten [`demo/`](demo/)-Datensatz: 6 Beispielprojekte, eine
generische Persona, einen Lebenslauf und passende Mock-Screenshots. Demo-Assets
neu erzeugen mit `npx tsx scripts/generate-demo-assets.ts`.

---

## KI-Assistent & MCP-Integration (Passgenaue Lebensläufe & Anschreiben)

Das Portfolio verfügt über einen integrierten [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)-Server unter `/api/mcp` (Streamable HTTP / SSE-Transport). Damit wird dein Portfolio zur aktiven Schnittstelle für moderne KI-Assistenten: Anstatt CV-Texte manuell in Chats zu kopieren, können KI-Agenten (Claude Desktop, Cursor, Antigravity) deine verifizierten Profildaten direkt auslesen und rollenspezifische Bewerbungsunterlagen erzeugen – unter strikter Einhaltung des einseitigen A4-Layouts und deines visuellen Portfoliodesigns.

### KI-Client anbinden

Füge den Server zu deiner MCP-Konfiguration hinzu (z. B. in `claude_desktop_config.json` oder in den Cursor MCP-Einstellungen):

```json
{
  "mcpServers": {
    "portfolio-tailor": {
      "url": "https://deine-portfolio-domain.de/api/mcp",
      "headers": {
        "Authorization": "Bearer DEIN_RESUME_MCP_API_KEY"
      }
    }
  }
}
```

*(Authentifizierung ist optional; wird `RESUME_MCP_API_KEY` in `.env.local` nicht gesetzt, sind Anfragen für lokale Tests ohne Token gestattet).*

### Verfügbare MCP-Tools & Prompts

| Tool / Prompt | Beschreibung |
|---|---|
| `get_official_resume` | **Immer zuerst aufrufen.** Lädt das verbindliche CV-JSON des Kandidaten direkt von der Live-Website. |
| `get_master_resume` | Liefert den erweiterten Gesamtpool aller Erfahrungen, Projekte und Skills. |
| `get_layout_guidelines` | Definiert strikte Grenzwerte für die einseitige A4-Darstellung (Zeichenlimits, Maximalanzahl an Einträgen). |
| `validate_resume_layout` | Validiert ein vorgeschlagenes CV-JSON gegen vertikale Layout-Budgets vor dem Rendern. |
| `generate_tailored_resume` | Rendert ein Pixel-perfektes einseitiges A4-PDF über headless Chromium, archiviert die Variante und liefert Download- und Vorschau-URLs. |
| `get_cover_letter_template` | Initialisiert ein strukturiertes Anschreiben-Template mit verifizierten Kontaktdaten, Links, Empfänger, Positionskarte und Profilbild. |
| `validate_cover_letter_layout`| Prüft Textlängen des Anschreibens gegen das einseitige Seitenbudget. |
| `generate_tailored_cover_letter` | Rendert ein einseitiges A4-PDF-Anschreiben im Design des Portfolios (Sidebar-Links, Positionskarte, Unterschrift, eingebettetes Profilbild). |
| `get_download_link` | Direkte Abfrage von öffentlichen Download-Links und Vorschau-URLs für jede Dokumenten-ID oder das offizielle Website-CV. |
| `list_saved_variants` / `list_saved_cover_letters` | Listet bisher erzeugte Dokumente mit Metadaten und Download-Links auf. |
| `generate_linkedin_banner` | Generiert ein 1584×396px LinkedIn-Hintergrundbanner im minimalistischen Terminal-Stil mit individuellem Rollentitel, Namen, Portfolio-Link, Skills und Statusline unter Beachtung der Avatar-Sicherheitszone. |
| `get_linkedin_banner_guidelines` | Liefert offizielle LinkedIn-Banner-Dimensionen (1584×396, 4:1), Profilbild-Sicherheitszonen, mobile Schnittränder und Gestaltungsregeln. |
| `prompt: tailor_cv_for_job` | Schritt-für-Schritt-Workflow für KI-Modelle zur passgenauen Anpassung des CVs an Stellenanzeigen unter Einseiten-Garantie. |
| `prompt: write_cover_letter_for_job` | Schritt-für-Schritt-Workflow für KI-Modelle zur Erstellung und Ausgabe des passenden Anschreibens. |

### Web-Vorschauen & Direktdownloads

Jedes generierte Dokument erhält eigene URLs:
- **Web-Vorschau**: `/[locale]/resume/preview/[id]` und `/[locale]/cover-letter/preview/[id]`
- **PDF-Direktdownload**: `/api/resume/download/[id]` und `/api/cover-letter/download/[id]`

### LinkedIn-Banner-Generator & Terminal-Studio

Das Portfolio enthält ein privates LinkedIn-Banner-Studio unter `/banner` (ohne Links in der öffentlichen Navigation, in `robots.ts` für Suchmaschinen gesperrt), ergänzt durch ein Offline-CLI-Tool (`npm run banner`), eine headless REST-API (`/api/banner/generate`) und ein MCP-Tool (`generate_linkedin_banner`):

- **Offizielle Spezifikationen**: Exakt 1584 × 396 Pixel (4:1 Seitenverhältnis), gestochen scharfe Monospace-Typografie, unter 8 MB, ohne künstliche Fensterrahmen oder Zierleisten.
- **Exakte Design-Tokens**: Monospace-Schriftart aus dem Portfolio (`font-mono`) auf den echten Website-Farben:
  - **Dark Mode**: `#18181b` (zinc-900 Hintergrund), `#fafafa` (Vordergrund), `#a1a1aa` (gedämpfte Tokens/Klammern), `#27272a` (Badges), `#34d399` (smaragdfarbenes, fettes Prompt-Symbol).
  - **Light Mode**: `#fafafa` (Hintergrund), `#18181b` (Vordergrund), `#71717a` (gedämpfte Tokens), `#f4f4f5` (Badges), `#10b981` (smaragdfarbenes, fettes Prompt-Symbol).
- **Kollisionsfreie Sicherheitszonen**:
  - **Desktop-Profilbildzone**: Verankerung bei `x = 380px` mit 40px Puffer, sodass das runde 160px-LinkedIn-Profilbild (Bereich `0..340px` links unten) niemals Namen, Titel oder Tags verdeckt.
  - **Mobile Schnittgrenzen**: Rechtsbündige Elemente (Statusline, Link) verankern bei `x = 1400px` (22px Puffer innerhalb des mobilen Schnittbereichs `maxX = 1422px`).
  - **Dynamische vertikale Zentrierung**: Berechnet die Gesamthöhe aller aktivierten Bausteine und zentriert den Textblock vertikal um `y = 198px`.
  - **Visuelles Sicherheitszonen-Overlay**: Zuschaltbare Hilfslinien im Studio zur direkten visuellen Kontrolle.

#### Modulare Bausteine

| Baustein | Optionen | Terminal-Darstellung |
|---|---|---|
| **Name** | Ein/Aus · Texteingabe · Präfix (`~/ Name` vs `Plain`) | `~/ Joel Dettinger` (Pfad-Stil) oder `Joel Dettinger` |
| **Rollentitel** | Ein/Aus · Texteingabe · Prompt-Symbol (`>` / `❯` / `$` / `None`) · **Cursor-Schalter (`█`)** | `> AI Engineer █` (mit smaragdfarbenem Prompt passend zur Hero-Section) |
| **Portfolio-Link** | Ein/Aus · URL-Eingabe · Position (`Below` unter dem Stack vs `Corner` rechts unten) · Format (`↗ Arrow`, `curl`, `web:`, `Plain`) | `↗ joeldettinger.com` oder `curl joeldettinger.com` |
| **Skills & Tech-Stack** | Ein/Aus · Chips hinzufügen/löschen (`×`) · 1-Klick-Vorschläge · 5 Terminal-Stile (`Blocks`, `[ ]`, `· Inline`, `\| Pipe`, `stack:`) | `[Python]` `[PyTorch]` oder `Python \| PyTorch` oder `stack: Python · PyTorch` |
| **Tagline** | Ein/Aus · Texteingabe · Format (`Plain` vs `# Comment`) | `Building intelligent systems & agents` oder `# Comment` |
| **Statusline** | Ein/Aus · Statustext · Oben rechts (`x=1400, y=65`) · 8 wählbare Terminal-Icons | `● open to work` (Grün, Bernstein, Cyan, Stern ✦, Blitz ⚡, Pfeil ❯, Ring ○, Kein Icon) |

#### CLI-Generierung & Batch-Export

Banner direkt im Terminal rendern, ohne den Browser öffnen zu müssen:

```bash
# Standard-Export mit Rolle und Link
npm run banner -- --title "AI Engineer" --link "joeldettinger.com"

# Vollständig angepasster CLI-Export
npm run banner -- \
  --title "AI Engineer" \
  --name "Joel Dettinger" \
  --link "joeldettinger.com" \
  --tag-style pipe \
  --link-style curl \
  --no-cursor \
  --status "open to work" \
  --theme dark \
  --out banners
```

Unterstützte CLI-Optionen:
- `--title, -r`: Rollenbezeichnung / Job-Titel (Standard: `AI Engineer`).
- `--name, -n`: Name des Entwicklers (Standard aus `site.config.json`).
- `--link, -l`: Portfolio- oder GitHub-URL.
- `--tag-style, --style`: Terminal-Skill-Format (`block`, `bracket`, `inline`, `pipe`, `kv`).
- `--link-style`: Link-Format (`arrow`, `curl`, `kv`, `plain`).
- `--no-cursor`: Blockcursor `█` hinter dem Job-Titel ausblenden.
- `--status`: Statustext für die Statusline oben rechts.
- `--skills, -s`: Kommagetrennte Liste von Technologien (z. B. `Python,PyTorch,Docker`).
- `--theme, -t`: `dark`, `light` oder `both` (erzeugt Dark- und Light-Varianten).
- `--guides`: Sicherheitszonen-Hilfslinien im exportierten Banner einblenden.
- `--out, -o`: Ausgabeverzeichnis für PNG- und SVG-Dateien (Standard: `banners/`).

#### Studio-Bedienung & Exportformate

- **Single-Viewport-Design**: Auf Desktop-Bildschirmen passt das Studio vollständig in ein bildschirmfüllendes Layout (`h-screen overflow-hidden`) ohne Scrollbalken.
- **Responsives Mobile-Studio**: Fixierte Live-Vorschau oben mit Touch-optimierten Schaltern im unteren Bereich.
- **Exportformate**: Standard-PNG (1584×396 px), Retina-2x-PNG (3168×792 px), Vektor-SVG, SVG-Direktkopie in die Zwischenablage und automatisierte REST-API (`/api/banner/generate`).

---

## Deployment

GitHub Actions baut ein Docker-Image, pusht es zu GHCR und stößt ein Redeploy an
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). `GITHUB_TOKEN`
wird nur als BuildKit-Secret übergeben – nie in ein Image-Layer eingebrannt. Eine
öffentliche **Live-Demo** kann ganz ohne Secrets deployt werden (Demo-Modus
greift automatisch).

---

## Tech-Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · next-intl ·
Model Context Protocol (@modelcontextprotocol/sdk) · Puppeteer (Chromium PDF-Engine) ·
Framer Motion · sharp · nodemailer · Umami · Docker.

## Lizenz

Veröffentlicht unter der CC BY-NC 4.0 Lizenz. Siehe [`LICENSE`](LICENSE).
