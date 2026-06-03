## Automated IT Infrastructure Recovery with Terraform

A bachelor thesis project implementing an automated disaster recovery solution using Infrastructure as Code (IaC). The system uses Terraform and Terragrunt to provision a complete Azure cloud environment — including networking, virtual machines, and a GitLab CI/CD runner — from a single local command following total infrastructure failure.

### The Challenge

The project addressed a critical "chicken-and-egg" problem in a Zero-Trust security environment: the existing CI/CD runners could not provision recovery infrastructure from outside the environment (security violation), yet the infrastructure needed to exist first before an internal runner could be created. The solution required bootstrapping the entire secure foundation — including the GitLab Runner itself — from a local machine.

### Key Features

- **Automated Infrastructure Provisioning**: Terraform declaratively defines and creates all Azure resources — virtual network (hub-and-spoke topology), subnets, VM, and Azure Bastion Host.
- **Dynamic GitLab Runner Configuration**: `cloud-init` automatically configures the VM on first boot: installs Docker, registers the GitLab Runner with dynamic credentials, and sets up systemd services for automated maintenance.
- **GitLab Integration**: Terraform automatically creates a GitLab group and populates it with repositories, making code immediately available to the newly created runner.
- **Modular Architecture**: Three-layer structure — Core modules → Standard Building Blocks (SBBs) → Exposed Modules — promotes reusability and compliance.
- **Dual Deployment Modes**: Shell scripts for local disaster recovery execution + a full `.gitlab-ci.yml` pipeline for remote validation and management.
- **Secure by Design**: Azure Bastion eliminates public SSH exposure; NSGs enforce strict inbound/outbound firewall rules from the first moment.

### Technical Highlights

- **Terraform + Terragrunt**: Declarative IaC with DRY configuration via Terragrunt and remote state management
- **cloud-init**: VM bootstrapping with dynamic variable injection from Terraform — fully automated, zero-touch configuration
- **GitLab CI/CD**: Multi-stage pipeline with linting, validation, plan, apply, and manual approval gates for destructive operations
- **Shell Scripts**: Single-command disaster recovery interface (`apply.sh` / `destroy.sh`) for the bootstrap scenario

### Personal Learnings

Designing a system that resolves a procedural deadlock in a high-security corporate context required thinking deeply about bootstrapping sequences and trust boundaries. The project transformed an inherently manual, error-prone disaster recovery process into a fully automated, repeatable system — a hands-on deep dive into how real DevOps teams approach infrastructure reliability.