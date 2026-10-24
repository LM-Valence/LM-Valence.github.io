# Bilan Valence — historique commun UAG / UAD

## Objectif

Chaque soir, le manager renseigne ses deux valeurs de « prises restantes » (UAG/UAD) et partage le bilan PNG sur Teams ou par e-mail. Après un partage réussi, **la date et ces deux valeurs seulement** sont archivées dans une base commune. Le graphique du bilan montre alors les **six dernières journées enregistrées**, même si différents managers ont réalisé les saisies depuis différents téléphones.

La direction peut consulter l'historique directement sur les PNG transmis et choisir une date antérieure dans l'application pour afficher les six journées précédentes.

## Confidentialité

- Données centralisées : date, prises restantes UAG et prises restantes UAD.
- Aucun nom, commentaire, indicateur de sécurité, horaire, réception ni autre champ du bilan centralisé.
- L'accès à la base requiert un **code d'équipe privé**, non présent dans le dépôt GitHub.
- Faire valider le service de stockage par votre direction et la sécurité informatique avant d'y transmettre des chiffres réels.
- Le site actuel continue à fonctionner avec historique local tant que la base commune n'est pas activée.

## Déployer le service Cloudflare Worker + D1 (personne autorisée)

Les fichiers de ce répertoire sont prêts : worker.js, schema.sql et wrangler.json. L'hébergement du service nécessite une étape réelle de déploiement.

Dans le répertoire bilan/backend, après installation de Node.js :

1. Se connecter au compte Cloudflare autorisé : npx wrangler login
2. Créer la base : npx wrangler d1 create bilan-valence-history
3. Copier l'identifiant database_id obtenu dans wrangler.json. Conserver le binding HISTORY_DB.
4. Créer la table : npx wrangler d1 execute bilan-valence-history --remote --file=./schema.sql
5. Définir le secret partagé privé : npx wrangler secret put HISTORY_ACCESS_TOKEN
   Choisir un code d'au moins 12 caractères ; ne jamais le publier sur GitHub.
6. Publier l'API : npx wrangler deploy
7. Reporter l'adresse HTTPS du Worker + /api/history dans bilan/history-config.js du site, sans y mettre le code d'équipe.
8. Transmettre le code d'accès uniquement aux managers concernés.

Documentation Cloudflare : https://developers.cloudflare.com/d1/get-started/

## Sur chaque téléphone

Une fois le service actif, le manager ouvre https://lm-valence.github.io/bilan/ et saisit une seule fois son code d'équipe dans le petit encart « Historique commun ».

- L'application charge les données centralisées automatiquement, avec un indicateur de synchronisation.
- La saisie et le partage Android restent identiques.
- Quand le partage réussit ou que le PNG de secours est généré, la journée est enregistrée dans l'historique commun.
- En cas de connexion absente ou d'erreur, l'application annonce explicitement « historique local uniquement ».
- Une modification concurrente d'un même jour n'écrase pas silencieusement la version déjà enregistrée.
- Le bouton facultatif « Importer mes 6 anciens bilans » permet d'ajouter des jours présents sur un ancien téléphone sans écraser ceux déjà synchronisés.

## Test de réception

Tester sur deux téléphones avec des valeurs fictives à deux dates. Vérifier que le second retrouve les deux journées et qu'une image partagée affiche les six derniers jours disponibles. Vider la base de ses données de test avant la mise en production.

**Important : le fonctionnement multi-téléphones n'est actif qu'après le déploiement de la base autorisée et le renseignement de son URL.**
