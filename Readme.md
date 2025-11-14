<a id="readme-top"></a>

[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<br />
<div align="center">
  <a href="#">
    <img src="public/favicon-software-dark.svg" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Software Portfolio | Next.js & Strapi</h3>

  <p align="center">
    A personal portfolio showcasing software development projects, built with Next.js and a Strapi Headless CMS.
    <br />
    <a href="#about-the-project"><strong>Explore the Features »</strong></a>
    <br />
    <br />
    <a href="https://{process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN}">View Demo</a>
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
        <li><a href="#backend-setup-strapi">Backend Setup (Strapi)</a></li>
        <li><a href="#frontend-setup-nextjs">Frontend Setup (Next.js)</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## About The Project

This repository contains the frontend for a full-stack personal software portfolio. All content, from project details to skill lists, is managed through a flexible Strapi Headless CMS, allowing for easy updates without redeploying the frontend.

Here's why this architecture is effective:
* **Headless & Dynamic:** Built with Strapi, all project data is fetched at build-time (SSG) or request-time (SSR/ISR) for excellent performance and maintainability.
* **Modern User Experience:** The site is fully responsive, supports internationalization (EN/DE), and features a dynamic light/dark theme that respects user preferences.
* **Scalable:** Using Next.js provides a robust foundation for Server-Side Rendering, Static Site Generation, and a great developer experience.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

This project is built with a modern, decoupled architecture using the latest industry-standard tools.

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind][TailwindCSS]][Tailwind-url]
* [![Strapi][Strapi.io]][Strapi-url]
* [![Vercel][Vercel]][Vercel-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

To get a local copy up and running, you will need to set up both the backend (Strapi) and this frontend (Next.js) service.

### Prerequisites

Ensure you have the following software installed on your machine.
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm
    ```sh
    npm install npm@latest -g
    ```

### Backend Setup (Strapi)

The backend must be running first. These instructions assume you are running them from the `/backend` directory of the original project monorepo.

1.  Navigate into the `backend` directory.
    ```sh
    cd backend
    ```
2.  Install NPM packages.
    ```sh
    npm install
    ```
3.  Build the Strapi admin panel.
    ```sh
    npm run build
    ```
4.  Start the Strapi development server (runs on `http://localhost:1337`).
    ```sh
    npm run develop
    ```
5.  **Admin Setup & Permissions:** Navigate to `http://localhost:1337/admin` to create your admin account. Then, go to **Settings > Roles > Public** and grant `find` and `findOne` permissions for all your software-related content types (projects, skills, etc.).

### Frontend Setup (Next.js)

These instructions should be run from the root directory of this codebase.

1.  Install NPM packages.
    ```sh
    npm install
    ```
2.  Create an environment file. Copy `.env.example` to a new file named `.env.local` and fill in your variables. At a minimum, you need:
    ```env
    NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
    NEXT_PUBLIC_SOFTWARE_DOMAIN=localhost:3000
    ```
3.  Start the Next.js development server (runs on `http://localhost:3000`).
    ```sh
    npm run dev
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the MIT License. See the `LICENSE` file for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Project Link: [https://github.com/dettinjo/portfolio_frontend](https://github.com/dettinjo/portfolio_frontend)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

This project was made possible by these incredible tools and libraries.

* [shadcn/ui](https://ui.shadcn.com/)
* [next-intl](https://next-intl.dev/)
* [Framer Motion](https://www.framer.com/motion/)
* [Lucide React](https://lucide.dev/)
* [Devicon](https://devicon.dev/)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[issues-shield]: https://img.shields.io/github/issues/dettinjo/portfolio_frontend.svg?style=for-the-badge
[issues-url]: https://github.com/dettinjo/portfolio_frontend/issues
[license-shield]: https://img.shields.io/github/license/dettinjo/portfolio_frontend.svg?style=for-the-badge
[license-url]: https://github.com/dettinjo/portfolio_frontend/blob/main/LICENSE
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Strapi.io]: https://img.shields.io/badge/Strapi-2E7EEA?style=for-the-badge&logo=strapi&logoColor=white
[Strapi-url]: https://strapi.io/
[Vercel]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/