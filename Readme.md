<a id="readme-top"></a>

[![Issues][issues-shield]][issues-url]
[![Issues][issues-shield]][issues-url]
[![CC BY-NC 4.0 License][license-shield]][license-url]

<br />
<div align="center">
  <a href="#">
    <img src="public/favicon-dark.svg" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Software Portfolio | Next.js & Payload CMS</h3>

  <p align="center">
    A personal portfolio showcasing software development projects, built with Next.js and Payload CMS.
    <br />
    <a href="#about-the-project"><strong>Explore the Features »</strong></a>
    <br />
    <br />
    <a href="https://{process.env.NEXT_PUBLIC_SERVER_URL}">View Demo</a>
    ·
    <a href="https://github.com/dettinjo/portfolio_frontend/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/dettinjo/portfolio_frontend/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## About The Project

This repository contains a full-stack personal software portfolio. It leverages the power of Next.js for the frontend and Payload CMS as a headless content management system, both integrated into a single repository for a seamless development experience.

Key architectural features:
* **Unified Stack:** Next.js and Payload CMS run together, sharing types and reducing context switching.
* **Headless & Dynamic:** Project data, skills, and resume details are managed via Payload and fetched dynamically.
* **Modern User Experience:** Fully responsive, supports internationalization (EN/DE), and includes dark/light mode.
* **Containerized:** Fully Dockerized Setup for consistent development and production environments, including a PostgreSQL database.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

This project is built with a modern, robust tech stack:

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind][TailwindCSS]][Tailwind-url]
* [![Payload][Payload]][Payload-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![Docker][Docker]][Docker-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for the PostgreSQL database)

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/dettinjo/portfolio_frontend.git
    cd portfolio_frontend
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Environment Setup**
    Copy the example environment file to `.env.local` and configure your variables.
    ```sh
    cp .env.example .env.local
    ```
    *Open `.env.local` and ensure parameters like `Use local database` or `Postgres connection string` are set correctly. The defaults usually work for local Docker development.*

4.  **Start the Development Server**
    This command will automatically start the PostgreSQL database container (via Docker Compose) and then launch the Next.js application.
    ```sh
    npm run dev
    ```

5.  **Access the Application**
    *   **Frontend:** `http://localhost:3000`
    *   **Admin Panel:** `http://localhost:3000/admin` (Create your first user here to get started)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the CC BY-NC 4.0 License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Project Link: [https://github.com/dettinjo/portfolio_frontend](https://github.com/dettinjo/portfolio_frontend)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

* [shadcn/ui](https://ui.shadcn.com/)
* [next-intl](https://next-intl.dev/)
* [payload-cms](https://payloadcms.com/)
* [Lucide React](https://lucide.dev/)
* [Devicon](https://devicon.dev/)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[issues-shield]: https://img.shields.io/github/issues/dettinjo/portfolio_frontend.svg?style=for-the-badge
[issues-url]: https://github.com/dettinjo/portfolio_frontend/issues
[license-shield]: https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg
[license-url]: https://creativecommons.org/licenses/by-nc/4.0/
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Payload]: https://img.shields.io/badge/Payload-000000?style=for-the-badge&logo=payload&logoColor=white
[Payload-url]: https://payloadcms.com/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/