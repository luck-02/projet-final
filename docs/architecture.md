# Architecture

## Schéma des composants

```
Internet
   │
   ▼
[Ingress NGINX]
   │
   ├──► [frontend]        (Deployment, 2 replicas)
   ├──► [backend/catalogue] (Deployment, HPA)
   └──► [backend/orders]    (Deployment, HPA)
              │
              ▼
         [PostgreSQL]     (StatefulSet + PVC)
```

## Namespace

Tous les composants sont déployés dans le namespace `projet-final`.

## Flux réseau

- Le frontend est exposé via l'Ingress sur `/`
- Les APIs sont exposées via l'Ingress sur `/api/catalogue` et `/api/orders`
- La base de données est accessible uniquement en ClusterIP depuis les backends
- NetworkPolicy : les backends ne peuvent contacter que PostgreSQL, pas le frontend

## Stockage

- PostgreSQL utilise un StatefulSet avec un PersistentVolumeClaim de 5Gi
- Les données survivent aux redémarrages de pods

## Gestion de la configuration

- Variables non-sensibles : ConfigMap
- Identifiants, mots de passe : Secret Kubernetes (base64, non versionnés)

## Scalabilité

- HPA sur `backend/catalogue` : scale entre 2 et 5 replicas selon CPU > 60%
- RollingUpdate sur tous les Deployments (maxUnavailable: 0)

## Sécurité

- ServiceAccount dédié par service
- RBAC : droits minimaux (principle of least privilege)
- NetworkPolicy : isolation inter-services
- Pas de `latest` tag, images scannées en CI
