# Nom du service docker-compose
SERVICE = nodeapp

# Commande docker-compose (ou docker compose selon ta version)
DC = docker compose

# ======================
# Commandes principales
# ======================

# Démarrer le conteneur en arrière-plan
up:
	$(DC) up -d

# Démarrer avec logs affichés
logs:
	$(DC) up

# Mettre en pause le conteneur
pause:
	docker pause $(SERVICE)

# Reprendre le conteneur
unpause:
	docker unpause $(SERVICE)

# Arrêter le conteneur (sans le supprimer)
stop:
	$(DC) stop

# Supprimer les conteneurs, mais garder les volumes et images
down:
	$(DC) down

# ======================
# Nettoyage
# ======================

# Supprimer tout (conteneurs, volumes, réseaux)
clean:
	$(DC) down -v --rmi all --remove-orphans

# Supprimer uniquement les volumes
clean-volumes:
	docker volume prune -f

# Supprimer uniquement les images non utilisées
clean-images:
	docker image prune -f

# ======================
# Utilitaires
# ======================

# Voir les logs du service
logs-follow:
	$(DC) logs -f $(SERVICE)

# Lister les conteneurs en cours
ps:
	$(DC) ps

# Redémarrer le service
restart:
	$(DC) restart $(SERVICE)

# Ouvrir un shell interactif dans le conteneur
sh:
	docker exec -it $(SERVICE) sh
