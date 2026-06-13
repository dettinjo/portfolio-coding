## Overview

Reproducible Kubernetes clusters on Azure described entirely as code, with GitLab CI/CD and automatic TLS.

<p align="center">
  <img src="/media/projects/helmforge-platform/gallery/shot1.webp" alt="HelmForge — Kubernetes IaC Platform screenshot 1" width="32%" />
  <img src="/media/projects/helmforge-platform/gallery/shot2.webp" alt="HelmForge — Kubernetes IaC Platform screenshot 2" width="32%" />
  <img src="/media/projects/helmforge-platform/gallery/shot3.webp" alt="HelmForge — Kubernetes IaC Platform screenshot 3" width="32%" />
</p>

## Features

- Whole stack (AKS, networking, DNS) as Terraform/Terragrunt modules
- NGINX ingress + cert-manager for automatic Let's Encrypt TLS
- GitLab CI/CD pipelines with plan/apply gates
- One-command bootstrap and teardown scripts

## Tech stack

Terraform · Terragrunt · Kubernetes · Docker · Docker Compose · NGINX · GitLab CI/CD · Shell Scripting · Microsoft Azure · Ingress · cert-manager · SSL/TLS · Infrastructure as Code (IaC)
