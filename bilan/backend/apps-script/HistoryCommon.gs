/**
 * BILAN VALENCE - Historique des prises UAG/UAD, au sein d'un classeur EXISTANT.
 *
 * Dépend uniquement d'Apps Script + du classeur de LM Pilot.
 * AUCUN champ d'affectation, nom ou commentaire n'est lu/modifié.
 *
 * Installer ces fonctions dans le projet Apps Script autorisé qui peut modifier
 * le classeur existant. Puis ajouter un branchement dans ses doGet/doPost :
 *
 * doGet(e)  : if(e?.parameter?.bilan === 'history') return BILAN_read(e);
 * doPost(e) : if(e?.parameter?.bilan === 'history') return BILAN_write(e);
 *
 * Déployer en application web "Exécuter en tant que moi" + accès "Tout le monde"
 * UNIQUEMENT si la politique informatique de l'entreprise le permet.
 * Une clef secrète de 64 caractères protège les relevés et doit être
 * transmise par un lien privé, PAS mise en dur dans le site GitHub public.
 */
const BILAN_TAB_NAME_ = 'Historique_Bilan_Valence';
const BILAN_SECRET_PROP_ = 'BILAN_HISTORY_SECRET';
const BILAN_SHEET_PROP_ = 'BILAN_HISTORY_SPREADSHEET_ID';
const BILAN_MAX_PICKS_ = 10000000;

/** Installation UNE SEULE FOIS par le propriétaire du script. */
function BILAN_installerHistorique() {
  const ss = BILAN_classeur_();
  let sheet = ss.getSheetByName(BILAN_TAB_NAME_);
  if (!sheet) {
    sheet = ss.insertSheet(BILAN_TAB_NAME_);
    sheet.getRange(1,1,1,5).setValues([[
      'Date','Prises_UAG','Prises_UAD','Revision','Mis_a_jour'
    ]]);
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.getRange('B:D').setNumberFormat('0');
    sheet.getRange('E:E').setNumberFormat('@');
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(BILAN_SECRET_PROP_)) {
    props.setProperty(BILAN_SECRET_PROP_, BILAN_alea_());
  }
  const link = BILAN_lienPrive();
  Logger.log('Installation réussie. LIEN PRIVE : ' + link);
  return {ok:true,onglet:BILAN_TAB_NAME_,lienPrive:link};
}

/** Lien d'activation à envoyer exclusivement aux managers concernés. */
function BILAN_lienPrive() {
  const secret = PropertiesService.getScriptProperties().getProperty(BILAN_SECRET_PROP_);
  if (!secret) throw Error('Exécuter BILAN_installerHistorique() d’abord');
  return 'https://lm-valence.github.io/bilan/#bilan-historique='+encodeURIComponent(secret);
}

/** Révoque les anciens accès, puis renvoie un nouveau lien à communiquer. */
function BILAN_renouvelerLien() {
  PropertiesService.getScriptProperties().setProperty(BILAN_SECRET_PROP_, BILAN_alea_());
  return BILAN_lienPrive();
}

function BILAN_alea_() {
  return (Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'');
}

/** Utilise le CLASSEUR EXISTANT, ne crée aucun nouveau compte ni fichier. */
function BILAN_classeur_() {
  const direct = SpreadsheetApp.getActiveSpreadsheet();
  if (direct) return direct;
  const id = PropertiesService.getScriptProperties().getProperty(BILAN_SHEET_PROP_);
  if (id) return SpreadsheetApp.openById(id);
  throw Error('Script autonome : définir BILAN_HISTORY_SPREADSHEET_ID '+
    'dans Propriétés du script avec l’ID du classeur LM Pilot existant.');
}
function BILAN_onglet_() {
  const sheet = BILAN_classeur_().getSheetByName(BILAN_TAB_NAME_);
  if (!sheet) throw Error('Lancer BILAN_installerHistorique()');
  return sheet;
}
function BILAN_reponse_(obj, callback) {
  const value = JSON.stringify(obj);
  const allowed = typeof callback==='string' &&
    /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/.test(callback);
  if(allowed) {
    return ContentService.createTextOutput(callback+'('+value+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(value)
    .setMimeType(ContentService.MimeType.JSON);
}
function BILAN_autorise_(key) {
  const real = PropertiesService.getScriptProperties().getProperty(BILAN_SECRET_PROP_);
  return !!real && /^[0-9a-f]{64}$/i.test(String(key||'')) && key===real;
}
function BILAN_dateOK_(day) {
  if(typeof day!=='string'|| !/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
  const date = new Date(day+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day)return false;
  const now=Date.now();
  return date.getTime()>=now-730*86400000&&date.getTime()<=now+7*86400000;
}
function BILAN_nombreOK_(n) {
  return Number.isSafeInteger(n) && n>=0 && n<=BILAN_MAX_PICKS_;
}
function BILAN_dateTexte_(v) {
  if(v instanceof Date)return Utilities.formatDate(v,'UTC','yyyy-MM-dd');
  return String(v||'').slice(0,10);
}
function BILAN_lignes_() {
  const sh=BILAN_onglet_();
  const count=sh.getLastRow();
  if(count<2)return [];
  return sh.getRange(2,1,count-1,5).getValues().map((row,index)=>({
    rowNumber:index+2,
    date:BILAN_dateTexte_(row[0]),
    l_picks:Number(row[1]),
    r_picks:Number(row[2]),
    revision:Number(row[3])||1,
    updated_at:String(row[4]||'')
  })).filter(row=>/^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
    BILAN_nombreOK_(row.l_picks)&&BILAN_nombreOK_(row.r_picks));
}

/** Accessible sans connexion Google, mais seulement via la clef d'équipe privée. */
function BILAN_read(e) {
  const p=e&&e.parameter||{};
  const callback=p.callback;
  if(!BILAN_autorise_(p.k))return BILAN_reponse_({ok:false,error:'Accès refusé'},callback);
  try {
    const rows=BILAN_lignes_().sort((a,b)=>a.date.localeCompare(b.date));
    const to=p.to&&/^\d{4}-\d{2}-\d{2}$/.test(p.to)?p.to:'9999-12-31';
    const records=rows.filter(r=>r.date<=to).slice(-180).map(r=>({
      date:r.date,l_picks:r.l_picks,r_picks:r.r_picks,
      revision:r.revision,updated_at:r.updated_at
    }));
    return BILAN_reponse_({ok:true,records:records},callback);
  }catch(error) {
    console.error('Erreur lecture historique Bilan Valence',String(error));
    return BILAN_reponse_({ok:false,error:'Lecture indisponible'},callback);
  }
}

/** POST simple text/plain ; vérification ensuite par GET dans l'application. */
function BILAN_write(e) {
  const raw=String(e&&e.postData&&e.postData.contents||'');
  if(raw.length>1100)return BILAN_reponse_({ok:false,error:'Requête trop longue'});
  let data;
  try {data=JSON.parse(raw);}catch{ return BILAN_reponse_({ok:false,error:'JSON incorrect'}); }
  if(!BILAN_autorise_(data.k))return BILAN_reponse_({ok:false,error:'Accès refusé'});
  if(!BILAN_dateOK_(data.date)||!BILAN_nombreOK_(data.l_picks)||
     !BILAN_nombreOK_(data.r_picks)||
     !(data.revision===null||(Number.isSafeInteger(data.revision)&&data.revision>=1))) {
    return BILAN_reponse_({ok:false,error:'Valeurs incorrectes'});
  }
  const lock=LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sh=BILAN_onglet_();
    const existing=BILAN_lignes_().find(r=>r.date===data.date);
    if(existing && existing.l_picks===data.l_picks && existing.r_picks===data.r_picks) {
      return BILAN_reponse_({ok:true,unchanged:true,revision:existing.revision});
    }
    if((existing?existing.revision:null)!==data.revision) {
      return BILAN_reponse_({ok:false,error:'Conflit : une autre version existe'});
    }
    const updated_at=new Date().toISOString();
    if(existing) {
      sh.getRange(existing.rowNumber,2,1,4).setValues([[
        data.l_picks,data.r_picks,existing.revision+1,updated_at
      ]]);
      return BILAN_reponse_({ok:true,revision:existing.revision+1});
    }
    sh.appendRow([data.date,data.l_picks,data.r_picks,1,updated_at]);
    return BILAN_reponse_({ok:true,revision:1});
  }catch(error) {
    console.error('Erreur écriture historique Bilan Valence',String(error));
    return BILAN_reponse_({ok:false,error:'Écriture indisponible'});
  }finally{
    if(lock.hasLock())lock.releaseLock();
  }
}
