# Projet Final — Clusteurisation de conteneurs

> Concevoir, déployer et opérer une application microservices sur Kubernetes (CI/CD, observabilité, HA)

## Architecture

```
frontend  ──►  backend/catalogue  ──►  PostgreSQL
          ──►  backend/orders     ──►  PostgreSQL
```

Exposition via **Ingress** (NGINX) dans un namespace dédié.

## Prérequis

- kubectl ≥ 1.28
- helm ≥ 3.x
- Docker + accès registry (GHCR ou Docker Hub)
- Cluster Kubernetes accessible (Minikube, k3s, GKE…)
- `metrics-server` installé (pour HPA)

## Déploiement rapide

```bash
# 1. Namespace
kubectl apply -f k8s/namespaces/

# 2. Config & Secrets
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/      # à créer localement, non versionnés

# 3. Base de données
kubectl apply -f k8s/deployments/postgres.yaml

# 4. Backends + Frontend
kubectl apply -f k8s/deployments/

# 5. Services + Ingress
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/

# 6. HPA
kubectl apply -f k8s/hpa/
```

## Structure du repo

```
.
├── k8s/                  # Manifests Kubernetes
│   ├── namespaces/
│   ├── deployments/
│   ├── services/
│   ├── ingress/
│   ├── configmaps/
│   ├── secrets/          # Ignoré par git — à créer localement
│   ├── hpa/
│   └── networkpolicies/
├── helm/                 # Chart Helm (optionnel)
├── frontend/             # Code source frontend
├── backend/
│   ├── catalogue/        # API catalogue
│   └── orders/           # API orders
├── .github/workflows/    # CI/CD GitHub Actions
├── docs/
│   ├── architecture.md   # Schéma + explications
│   └── runbook.md        # Procédures d'exploitation
└── README.md
```

## Membres de l'équipe

| Membre | Rôle principal |
|--------|---------------|
| ...    | Frontend / DevOps |
| ...    | Backend (catalogue + orders) |
| ...    | Kubernetes / CI/CD / Observabilité |

## Choix techniques

- **Runtime** : Node.js (backends) + Nginx (frontend)
- **BDD** : PostgreSQL via StatefulSet + PVC
- **Ingress** : NGINX Ingress Controller
- **Monitoring** : Prometheus + Grafana
- **CI/CD** : GitHub Actions → GHCR → kubectl apply

## Liens utiles

- [Architecture détaillée](docs/architecture.md)
- [Runbook](docs/runbook.md)
