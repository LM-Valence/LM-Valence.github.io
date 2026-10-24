# Historique commun Bilan Valence — mise en service UNE FOIS

## Pour les managers : rien à changer au quotidien
Ils ouvrent Bilan Valence, renseignent les chiffres et appuient sur Partager. Aucun nouvel écran de connexion. Le graphique affiche les six dernières journées enregistrées par tous les managers.

## Ce qui manque encore
Le site est préparé, mais l'historique commun n'est pas actif tant que la connexion au Google Apps Script existant n'est pas déployée. Il ne faut ni nouvel abonnement ni nouveau compte, et les onglets de LM Pilot ne sont pas modifiés.

## Mise en service (uniquement par le propriétaire du script LM Pilot)
1. Ouvrir le projet Apps Script déjà utilisé par LM Pilot. Faire une copie de sécurité avant toute modification.
2. Ajouter le contenu du fichier HistoryCommon.gs (dans ce même dossier) comme nouveau fichier de script.
3. Au début du doGet(e) existant, ajouter une condition de routage :

    if (e && e.parameter && e.parameter.bilan === 'history') return BILAN_read(e);

4. Au début du doPost(e) existant, ajouter :

    if (e && e.parameter && e.parameter.bilan === 'history') return BILAN_write(e);

   Si doPost(e) n'existe pas, créer cette fonction uniquement pour l'historique. Conserver tout le code métier LM Pilot.
5. Exécuter BILAN_installerHistorique() dans l'éditeur Apps Script, avec le compte autorisé.

   - Si le script est lié au classeur LM Pilot, l'onglet séparé Historique_Bilan_Valence est créé dans ce classeur.
   - S'il s'agit d'un script autonome, renseigner la propriété BILAN_HISTORY_SPREADSHEET_ID avec l'ID du classeur LM Pilot existant, puis exécuter l'installation.
   - L'installation génère une clef longue et un lien d'activation privé pour les managers. Ce lien ne doit jamais être publié dans GitHub.

6. Mettre à jour le déploiement Web Apps Script en conservant les fonctions existantes. Pour ne demander aucune connexion Google aux managers, le déploiement doit être accessible anonymement, mais seulement **si la politique de sécurité de votre entreprise l'autorise**. Si l'entreprise bloque l'accès anonyme, ne pas le contourner.
7. Dans la page GitHub, renseigner l'URL du déploiement existant terminée par /exec dans bilan/history-google-config.js. L'URL n'est pas secrète ; la clef doit rester privée.
8. Ouvrir le lien privé une fois sur chaque téléphone concerné : le navigateur mémorise l'autorisation. Les managers conservent ensuite leur raccourci normal et n'ont pas de connexion à refaire.

## Vérifier
- Téléphone A : entrer les prises UAG et UAD d'une journée de test, générer le PNG ou partager.
- Téléphone B : ouvrir le bilan avec accès autorisé, vérifier que cette journée apparaît.
- Téléphone B : saisir le lendemain, puis vérifier sur A la présence des deux journées.
- Tester des dates sur six jours et le contrôle des modifications concurrentes.

## Sécurité
- Seuls date, prises UAG, prises UAD, révision et horodatage sont centralisés.
- Aucun nom, commentaire, indicateur de sécurité ou affectation LM Pilot n'est envoyé.
- Le lien privé donne accès en lecture/écriture : le communiquer uniquement aux managers concernés. Le propriétaire peut le révoquer avec BILAN_renouvelerLien().
- Ce système ne prouve pas l'identité individuelle de chaque manager ; il exige une validation informatique avant l'utilisation de données opérationnelles.
- Si un téléphone utilise un autre navigateur, il peut devoir ouvrir à nouveau son lien privé.
- En cas d'indisponibilité du stockage commun, l'historique local et le bouton Partager restent utilisables ; l'application indique qu'elle n'est pas synchronisée.

STATUT : le code est prêt et testé en simulation, mais la mise en service sur le script Google existant nécessite une intervention autorisée.
