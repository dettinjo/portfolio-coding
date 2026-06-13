<!-- portfolio:date=2025-06-01 -->

# Codebase — ein konfigurationsgesteuertes, GitHub-betriebenes Portfolio

**🌐 [English](README.md) · [Deutsch](README.de.md)**

Ein schnelles, SEO-optimiertes, vollständig zweisprachiges (EN/DE)
Entwickler-Portfolio-**Template**. Es enthält **keinerlei persönliche Daten** –
alles (Projekte, Skills, Lebenslauf, Identität, Rechtsseiten) wird zur Build-Zeit
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

## Deployment

GitHub Actions baut ein Docker-Image, pusht es zu GHCR und stößt ein Redeploy an
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). `GITHUB_TOKEN`
wird nur als BuildKit-Secret übergeben – nie in ein Image-Layer eingebrannt. Eine
öffentliche **Live-Demo** kann ganz ohne Secrets deployt werden (Demo-Modus
greift automatisch).

---

## Tech-Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · next-intl ·
Framer Motion · sharp · nodemailer · Umami · Docker.

## Lizenz

Veröffentlicht unter der CC BY-NC 4.0 Lizenz. Siehe [`LICENSE`](LICENSE).
