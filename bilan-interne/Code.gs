/**
 * Bilan Valence — application interne AUTONOME
 * AUCUN accès à LM Pilot et à ses classeurs d'affectation.
 * Déployer en application Web : DOMAIN + USER_DEPLOYING.
 */
const BV_ID_KEY='BILAN_VALENCE_PRIVATE_SPREADSHEET_ID';
const BV_ALLOWED_KEY='BILAN_VALENCE_ALLOWED_EMAILS';
const BV_TAB='Historique_reliquats';
const BV_MAX=10000000;
const BV_DOMAIN='leroymerlin.fr'; // L'application n'autorise que les comptes de ce domaine.

/**
 * Bouton d'installation visible dans l'éditeur Apps Script.
 * Interdit aux collaborateurs autres que le propriétaire du déploiement.
 * La procédure elle-même est privée (suffixe _).
 */
function installerBilanValence() {
  const active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const effective = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (!active || !effective || active !== effective || !active.endsWith('@'+BV_DOMAIN)) {
    throw Error('Installation réservée au propriétaire professionnel du projet');
  }
  return initialiserBilanValence_();
}

/** Une seule fois, sous un compte professionnel autorisé. */
function initialiserBilanValence_() {
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty(BV_ID_KEY);
  if (id) {
    const doc=SpreadsheetApp.openById(id);
    return {ok:true,url:doc.getUrl(),dejaInitialise:true};
  }
  const ss=SpreadsheetApp.create('Bilan Valence - Historique des reliquats');
  const tab=ss.getSheets()[0];
  tab.setName(BV_TAB);
  tab.getRange(1,1,1,5).setValues([['Date','Prises_UAG','Prises_UAD','Revision','Mis_a_jour']]);
  tab.setFrozenRows(1);
  tab.getRange('A:A').setNumberFormat('@');
  tab.getRange('B:D').setNumberFormat('0');
  tab.getRange('E:E').setNumberFormat('@');
  props.setProperty(BV_ID_KEY,ss.getId());
  return {ok:true,url:ss.getUrl(),dejaInitialise:false};
}

/** Option de filtrage par manager, avec rejet si Google ne fournit pas l'identité. */
function definirManagersAutorises_(liste) {
  if (typeof liste!=='string') throw Error('Liste de courriels attendue');
  const users=liste.split(/[;,\n]+/).map(v=>v.trim().toLowerCase()).filter(Boolean);
  if (!users.length||users.some(v=> !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))) {
    throw Error('Indiquer les adresses professionnelles autorisées');
  }
  PropertiesService.getScriptProperties().setProperty(BV_ALLOWED_KEY,users.join(','));
  return {ok:true,utilisateurs:users.length};
}
function bvAutoriser_() {
  // Double protection : contrôle du compte professionnel même si le déploiement
  // Google était configuré trop largement par erreur.
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) {
    throw Error('BV_IDENTITE_INDISPONIBLE');
  }
  if (!email.endsWith('@'+BV_DOMAIN)) {
    throw Error('BV_DOMAINE_NON_AUTORISE');
  }
  const allowed=PropertiesService.getScriptProperties().getProperty(BV_ALLOWED_KEY);
  if (allowed && allowed.split(',').indexOf(email)<0) {
    throw Error('BV_COMPTE_NON_AUTORISE');
  }
  return true;
}
function bvOnglet_() {
  const id=PropertiesService.getScriptProperties().getProperty(BV_ID_KEY);
  if (!id) throw Error('Base Bilan Valence non initialisée');
  const tab=SpreadsheetApp.openById(id).getSheetByName(BV_TAB);
  if (!tab)throw Error('Onglet historique absent');
  return tab;
}
function bvDateOK_(day) {
  if (typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const d=new Date(day+'T00:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===day&&
    d.getTime()>=Date.now()-730*86400000&&d.getTime()<=Date.now()+7*86400000;
}
function bvNombreOK_(n) {
  return Number.isSafeInteger(n)&&n>=0&&n<=BV_MAX;
}
function bvDateTexte_(v) {
  return v instanceof Date?Utilities.formatDate(v,'UTC','yyyy-MM-dd'):String(v||'').slice(0,10);
}
function bvLignes_() {
  const tab=bvOnglet_(),n=tab.getLastRow();
  if(n<2)return[];
  return tab.getRange(2,1,n-1,5).getValues().map((r,i)=>({
    row:i+2,date:bvDateTexte_(r[0]),
    l_picks:Number(r[1]),r_picks:Number(r[2]),
    revision:Number(r[3])||1,updated_at:String(r[4]||'')
  })).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&
    bvNombreOK_(r.l_picks)&&bvNombreOK_(r.r_picks));
}
function bvPublic_(r) {
  return {date:r.date,l_picks:r.l_picks,r_picks:r.r_picks,
    revision:r.revision,updated_at:r.updated_at};
}
function chargerHistoriqueBilan(jusquAu) {
  bvAutoriser_();
  if(!bvDateOK_(jusquAu))throw Error('Date non valide');
  return bvLignes_().filter(r=>r.date<=jusquAu)
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(-180).map(bvPublic_);
}
function enregistrerReliquatsBilan(d) {
  bvAutoriser_();
  if(!d||!bvDateOK_(d.date)||!bvNombreOK_(d.l_picks)||
    !bvNombreOK_(d.r_picks)||
    !(d.revision===null||(Number.isSafeInteger(d.revision)&&d.revision>=1))) {
    throw Error('Date, prises ou version incorrectes');
  }
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    const tab=bvOnglet_(),old=bvLignes_().find(r=>r.date===d.date);
    if(old&&old.l_picks===d.l_picks&&old.r_picks===d.r_picks)
      return {ok:true,unchanged:true,record:bvPublic_(old)};
    if((old?old.revision:null)!==d.revision)
      return {ok:false,code:'CONFLIT',message:'Un autre manager a déjà renseigné ou corrigé ce jour.'};
    const stamp=new Date().toISOString();
    if(old) {
      const rev=old.revision+1;
      tab.getRange(old.row,2,1,4).setValues([[d.l_picks,d.r_picks,rev,stamp]]);
      return {ok:true,record:{date:d.date,l_picks:d.l_picks,
        r_picks:d.r_picks,revision:rev,updated_at:stamp}};
    }
    tab.appendRow([d.date,d.l_picks,d.r_picks,1,stamp]);
    return {ok:true,record:{date:d.date,l_picks:d.l_picks,
      r_picks:d.r_picks,revision:1,updated_at:stamp}};
  } finally {if(lock.hasLock())lock.releaseLock();}
}
/**
 * Rendu direct, sans évaluation de modèle Apps Script.
 * Le grand HTML (photos intégrées + JS) peut provoquer une erreur au niveau
 * des scriptlets de HtmlService.createTemplateFromFile(...).evaluate().
 * Premium et HistoryClient contiennent chacun une balise <script> complète,
 * afin d'être des fragments HTML valides pour HtmlService.
 * Les balises <script> des deux marqueurs sont remplacées en bloc (pas de
 * double imbrication). Les trois insertions sont faites avant de servir la page.
 */
function bvPreparerPage_() {
  let html = HtmlService.createTemplateFromFile('Index').getRawContent();

  const inserts = [
    ['<script><?!= include("Premium") ?></script>', HtmlService.createTemplateFromFile('Premium').getRawContent()],
    ['<script><?!= include("HistoryClient") ?></script>', HtmlService.createTemplateFromFile('HistoryClient').getRawContent()]
  ];

  let url = '';
  try { url=ScriptApp.getService().getUrl()||''; }
  catch(e) { console.warn('BV_LIEN_INTERNE_OPTIONNEL'); }
  inserts.push(['<?!= JSON.stringify(internalLink) ?>',JSON.stringify(url)]);

  for (const [mark,content] of inserts) {
    if (html.indexOf(mark)<0) throw Error('BV_MODELE_INCOMPLET');
    html=html.split(mark).join(content);
  }
  return HtmlService.createHtmlOutput(html)
    .setTitle('Bilan Valence · Entrepôt')
    .addMetaTag('viewport','width=device-width, initial-scale=1, viewport-fit=cover');
}

function doGet() {
  try {
    // Conserver la protection du domaine ET l'identification professionnelle.
    bvAutoriser_();
    return bvPreparerPage_();
  } catch(e) {
    const reason=String(e && e.message || e || '');
    const code=reason.includes('BV_IDENTITE_INDISPONIBLE')
      ? 'BV-IDENTITE'
      : reason.includes('BV_DOMAINE_NON_AUTORISE')
      ? 'BV-DOMAINE'
      : reason.includes('BV_COMPTE_NON_AUTORISE')
      ? 'BV-AUTORISATION'
      : reason.includes('BV_MODELE_INCOMPLET')
      ? 'BV-FICHIER'
      : 'BV-AFFICHAGE';
    console.error('Bilan Valence : '+code+' - '+reason.slice(0,450));
    const message=code==='BV-IDENTITE'
      ? 'Google ne transmet pas votre identité au script avec ce mode de déploiement.'
      : code==='BV-DOMAINE' || code==='BV-AUTORISATION'
      ? 'Ce compte professionnel ne dispose pas de l’accès requis.'
      : 'Un problème empêche le chargement du formulaire.';
    return HtmlService.createHtmlOutput(
      '<!doctype html><html lang="fr"><meta charset="utf-8">'+
      '<title>Bilan Valence · Vérification</title>'+
      '<body style="font-family:Arial;padding:35px;color:#18384f">'+
      '<h2>Vérification de l’accès</h2>'+
      '<p>'+message+'</p><p>Code de diagnostic : <strong>'+code+'</strong></p>'+
      '<p>Le stockage de Bilan Valence n’a pas été effacé.</p></body></html>'
    ).setTitle('Bilan Valence · Vérification');
  }
}
function include(nom) {
  if(['Premium','HistoryClient'].indexOf(nom)<0)throw Error('Fichier non autorisé');
  return HtmlService.createTemplateFromFile(nom).getRawContent();
}
