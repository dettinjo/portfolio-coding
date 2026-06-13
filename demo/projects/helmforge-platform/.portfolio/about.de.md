## Überblick

Reproduzierbare Kubernetes-Cluster auf Azure, vollständig als Code beschrieben – mit GitLab CI/CD und automatischem TLS.

<p align="center">
  <img src="/media/projects/helmforge-platform/gallery/shot1.webp" alt="HelmForge — Kubernetes IaC Platform screenshot 1" width="32%" />
  <img src="/media/projects/helmforge-platform/gallery/shot2.webp" alt="HelmForge — Kubernetes IaC Platform screenshot 2" width="32%" />
  <img src="/media/projects/helmforge-platform/gallery/shot3.webp" alt="HelmForge — Kubernetes IaC Platform screenshot 3" width="32%" />
</p>

## Funktionen

- Gesamter Stack (AKS, Netzwerk, DNS) als Terraform/Terragrunt-Module
- NGINX-Ingress + cert-manager für automatisches Let's-Encrypt-TLS
- GitLab-CI/CD-Pipelines mit Plan-/Apply-Gates
- Bootstrap- und Teardown-Skripte per Befehl

## Tech-Stack

Terraform · Terragrunt · Kubernetes · Docker · Docker Compose · NGINX · GitLab CI/CD · Shell Scripting · Microsoft Azure · Ingress · cert-manager · SSL/TLS · Infrastructure as Code (IaC)
