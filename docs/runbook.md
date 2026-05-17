# Runbook — Exploitation

## Commandes de base

```bash
# Vue d'ensemble
kubectl get all -n projet-final

# Logs d'un service
kubectl logs -n projet-final deployment/catalogue --tail=100 -f

# Décrire un pod en erreur
kubectl describe pod -n projet-final <pod-name>

# État des PVC
kubectl get pvc -n projet-final
```

## Diagnostiquer une panne

1. `kubectl get pods -n projet-final` → identifier les pods KO (CrashLoopBackOff, Pending…)
2. `kubectl describe pod <pod>` → lire les Events en bas
3. `kubectl logs <pod> --previous` → logs du container avant crash
4. Vérifier les ressources : `kubectl top pods -n projet-final`

## Rollback

```bash
# Voir l'historique
kubectl rollout history deployment/catalogue -n projet-final

# Revenir à la version précédente
kubectl rollout undo deployment/catalogue -n projet-final

# Revenir à une version spécifique
kubectl rollout undo deployment/catalogue --to-revision=2 -n projet-final
```

## Scale manuel

```bash
kubectl scale deployment/catalogue --replicas=3 -n projet-final
```

## Restart d'un service

```bash
kubectl rollout restart deployment/catalogue -n projet-final
```

## Backup PostgreSQL

```bash
# Exec dans le pod postgres
kubectl exec -n projet-final statefulset/postgres -- \
  pg_dump -U postgres mydb > backup_$(date +%Y%m%d).sql
```

## Restore PostgreSQL

```bash
kubectl exec -i -n projet-final statefulset/postgres -- \
  psql -U postgres mydb < backup_20240101.sql
```

## Tester le self-healing

```bash
# Tuer un pod et observer le redémarrage automatique
kubectl delete pod -n projet-final <pod-name>
kubectl get pods -n projet-final -w
```

## Vérifier le HPA

```bash
kubectl get hpa -n projet-final
kubectl describe hpa catalogue -n projet-final
```
