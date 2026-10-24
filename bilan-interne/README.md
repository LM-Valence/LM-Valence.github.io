# BILAN VALENCE — version interne autonome (préparée, non déployée)

**Objectif :** conserver le fonctionnement du bilan mobile, avec un historique commun des six dernières journées de prises UAG/UAD, accessible aux managers du domaine professionnel autorisé.

Cette version ne dépend **d'aucun fichier, script ni classeur LM Pilot**. Elle a son propre projet Google Apps Script et crée son propre classeur Google Sheets privé.

## Les 5 fichiers du projet

- Code.gs — serveur Apps Script et stockage privé.
- Index.html — formulaire mobile actuel, photos réelles et interface.
- Premium.html — rendu PNG premium (2400 × 1350 px), icônes et histogramme.
- HistoryClient.html — historique commun et transfert interne via google.script.run.
- appsscript.json — manifeste demandant un accès au **domaine uniquement**.

Le dossier actuel est un **ensemble de sources**, pas une application déjà hébergée dans l'environnement Leroy Merlin. Le dépôt GitHub utilisé pour les sources reste public : n'y placer **aucun bilan réel, secret ou fichier confidentiel**. Les photos intégrées étaient déjà présentes sur la version publique.

## Installation par un responsable autorisé (UNE SEULE FOIS)

1. Valider le choix Google Apps Script / Sheets avec le service informatique de Leroy Merlin et vérifier que les applications Web limitées au domaine sont permises.
2. Dans un environnement Google Workspace **autorisé**, créer un **nouveau projet Apps Script autonome** nommé « Bilan Valence interne ». **Ne pas ouvrir, modifier ou importer le projet LM Pilot.**
3. Copier Code.gs dans le nouveau projet. Ajouter trois fichiers HTML nommés **Index**, **Premium** et **HistoryClient**, puis y copier les contenus correspondants.
4. Dans les paramètres du projet, activer l'affichage du manifeste et remplacer son contenu par appsscript.json.
5. Sélectionner puis exécuter **initialiserBilanValence** depuis l'éditeur. Autoriser une seule fois les accès Google Sheets demandés au propriétaire. Un **nouveau classeur privé Bilan Valence** est créé ; conserver le lien retourné. Ne pas partager directement la feuille avec tous les managers.
6. Option de protection supplémentaire pour les seuls managers : dans les **propriétés du script**, ajouter **BILAN_VALENCE_ALLOWED_EMAILS** avec les adresses professionnelles autorisées séparées par des virgules. Cette option **refuse l'accès** si la session Google ne fournit pas l'adresse de l'utilisateur. La tester avec une personne autorisée avant généralisation.
7. Aller dans **Déployer → Nouveau déploiement → Application Web**. Choisir :
   - **Exécuter en tant que : moi / propriétaire autorisé**.
   - **Qui a accès : uniquement les utilisateurs de mon domaine** (ou libellé équivalent).
   - **Ne jamais choisir Tout le monde, Toute personne possédant le lien, ou Anonyme.**
   - Si l'accès « domaine » n'est pas proposé, **arrêter le déploiement** et consulter l'IT ; ne pas créer une version ouverte.
8. Copier le **nouveau lien Google Apps Script /exec** et le tester d'abord avec deux managers autorisés sur deux téléphones différents.
9. Après test et validation, fournir **ce nouveau lien interne** aux managers. N'utilisez pas l'ancien lien GitHub pour les chiffres réels si les politiques de l'entreprise l'interdisent.

## Scénario de test

- Sur le téléphone A, renseigner des **valeurs fictives** le lundi et utiliser « Partager » ou « PNG ».
- Ouvrir le lien interne avec le téléphone B (compte professionnel autorisé), puis vérifier le lundi dans l'historique.
- Renseigner mardi sur le téléphone B, partager, et revenir au téléphone A : les deux dates doivent être présentes.
- Répéter jusqu'à six dates ; vérifier les chiffres UAG (vert), UAD (bleu), et les dates.
- Tenter l'accès depuis un compte externe : **l'accès doit être refusé**.
- Tester spécifiquement **Partager** sur Android ; le service HTML Google utilise un iframe sécurisé qui peut empêcher le menu natif. Dans ce cas, « PNG » permet de télécharger l'image pour l'ajouter manuellement à Teams ou e-mail.

## Données, confidentialité et limites

- Google Sheets centralise **uniquement la date, les prises restantes UAG/UAD, la révision et l'horodatage**.
- Les autres champs (réception, sécurité, commentaires, horaires) restent **localement dans le navigateur**, et sont visibles dans l'image **uniquement si le manager la partage**.
- Le navigateur peut ne pas conserver les brouillons durablement dans le cadre Google ; ne pas utiliser le stockage local comme archive officielle.
- Une base commune **privée** n'est pas une certification cybersécurité : le déploiement et les règles internes doivent être validés par l'entreprise.
- Les six dernières journées renseignées sont affichées dans le graphique ; les lignes des jours plus anciens restent dans la feuille, consultables en sélectionnant une date antérieure.
- Le serveur empêche l'écrasement silencieux d'une journée déjà modifiée par un autre manager.
- La version **https://lm-valence.github.io/bilan/** reste PUBLIQUE tant qu'elle n'est pas désactivée. Ne pas la présenter comme un site interne sécurisé. Une fois la migration interne validée, prévoir le retrait ou la transformation de ce lien public avec accord de l'équipe.

## État de la réalisation

**Préparé et testé par simulation** : création du classeur, lecture et écriture des journées, validation des chiffres, prévention des conflits, restrictions de domaine demandées, formulaire et rendu PNG.

**À faire réellement** : déployer dans le domaine professionnel autorisé, valider la politique de sécurité avec l'IT, tester sur deux téléphones et confirmer le comportement du partage Android. Aucune session ni infrastructure Google d'entreprise n'a été modifiée lors de cette préparation.
