## Automatisierte IT-Infrastruktur-Wiederherstellung mit Terraform

Ein Bachelorarbeitsprojekt, das Infrastructure as Code (IaC) mit Terraform einsetzt, um eine vollautomatische Disaster-Recovery-Lösung für Cloud-Infrastruktur umzusetzen. Entwickelt bei MHP Management and IT Consulting.

### Ausgangssituation

Traditionelle IT-Infrastruktur leidet unter manuellem, fehleranfälligem Wiederherstellungsprozess nach Ausfällen. Das Projekt automatisiert diesen Prozess vollständig durch deklarative Infrastrukturdefinitionen.

### Lösung

- **Terraform IaC** für vollständige Infrastruktur-Definitionen als Code (Microsoft Azure)
- **Terragrunt** für modulare, wiederverwendbare Terraform-Konfigurationen
- **GitLab CI/CD** Pipeline für automatisiertes Deployment und Rollback
- **Shell-Scripting** für Orchestrierung und Automatisierungslogik
- **Disaster-Recovery-Tests** mit automatisierter Validierung der Wiederherstellungszeit

### Ergebnis

Die Infrastruktur-Wiederherstellungszeit wurde von mehreren Stunden auf unter 15 Minuten reduziert. Der gesamte Prozess läuft ohne manuelle Eingriffe und ist versioniert, nachvollziehbar und wiederholbar.
