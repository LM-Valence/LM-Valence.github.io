/* Historique commun Bilan Valence : dates et prises UAG/UAD uniquement.
 * Code d'accès requis pour consulter / ajouter les relevés au stockage partagé.
 * Sans service configuré, l'ancien historique local continue de fonctionner.
 */
(function () {
  'use strict';
  const url = String(window.BILAN_SHARED_HISTORY_URL || '').trim();
  if (!/^https:\/\/[^/]+\/api\/history$/.test(url)) return;

  const savedTokenKey = 'bilan_valence_historique_commun_code_v1';
  const el = id => document.getElementById(id);
  const panel = el('historySharedPanel');
  const status = el('historySharedStatus');
  const open = el('historySharedOpen');
  const form = el('historySharedForm');
  const codeInput = el('historySharedCode');
  const cancel = el('historySharedCancel');
  const importButton = el('historyImport');
  if (!panel || !status || !open || !form) return;

  const state = {
    token: localStorage.getItem(savedTokenKey) || '',
    ready: false,
    remote: {},
    refreshing: null,
    lastRefresh: 0
  };
  panel.hidden = false;
  function display(message, tone) {
    status.textContent = message;
    panel.dataset.status = tone || 'idle';
  }
  function authHeaders(token, extra) {
    return Object.assign({'Authorization':'Bearer ' + token}, extra || {});
  }
  async function jsonResponse(response) {
    const data = await response.json().catch(()=>({}));
    if (!response.ok) {
      const reason = new Error(data.error || 'Connexion à l’historique impossible');
      reason.httpStatus = response.status;
      throw reason;
    }
    return data;
  }
  async function refreshWith(token, force) {
    if (state.refreshing && !force) return state.refreshing;
    const work = (async () => {
      display('Synchronisation de l’historique…', 'loading');
      const response = await fetch(url + '?limit=180', {
        method:'GET',
        headers: authHeaders(token),
        cache:'no-store'
      });
      const data = await jsonResponse(response);
      if (!Array.isArray(data.records)) throw new Error('Format de réponse incorrect');
      const remote = {};
      for (const record of data.records) {
        if (typeof record?.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
            Number.isSafeInteger(record.l_picks) && record.l_picks >= 0 &&
            Number.isSafeInteger(record.r_picks) && record.r_picks >= 0 &&
            Number.isSafeInteger(record.revision) && record.revision >= 1) {
          remote[record.date] = {
            l_picks:String(record.l_picks),
            r_picks:String(record.r_picks),
            revision:record.revision,
            updated_at:record.updated_at
          };
        }
      }
      state.remote = remote;
      state.ready = true;
      state.token = token;
      state.lastRefresh = Date.now();
      display('Historique commun à jour · ' + Object.keys(remote).length + ' journée(s) enregistrée(s)', 'ok');
      open.textContent = 'Actualiser';
      importButton.hidden = !localImportRows().length;
    })();
    state.refreshing = work;
    try {
      await work;
    } catch (error) {
      if (error.httpStatus === 401) {
        state.ready = false;
        state.token = '';
        state.remote = {};
        localStorage.removeItem(savedTokenKey);
        display('Code d’accès incorrect · Historique local uniquement', 'error');
        open.textContent = 'Se connecter';
      } else {
        // N'afficher jamais l'historique local comme s'il était synchronisé.
        state.ready = false;
        display('Historique commun indisponible · Historique local uniquement', 'error');
        open.textContent = 'Réessayer';
      }
      throw error;
    } finally {
      if (state.refreshing === work) state.refreshing = null;
    }
  }

  // Le rendu de l'image reste synchrone pour préserver le partage natif Android.
  // En cas de synchronisation réussie, les autres téléphones font autorité.
  window.sharedHistoryRows = function (selectedDate) {
    if (!state.ready) return null;
    const rows = {...state.remote};
    const left = document.getElementById('l_picks')?.value.trim();
    const right = document.getElementById('r_picks')?.value.trim();
    if (left !== '' && right !== '' &&
        Number.isSafeInteger(Number(left)) && Number(left) >= 0 &&
        Number.isSafeInteger(Number(right)) && Number(right) >= 0) {
      rows[selectedDate] = {...(rows[selectedDate]||{}),l_picks:left,r_picks:right};
    }
    return rows;
  };

  window.sharedHistoryPublish = async function () {
    const day = el('date')?.value;
    const left = el('l_picks')?.value.trim();
    const right = el('r_picks')?.value.trim();
    if (!state.token || !state.ready) {
      display('Bilan partagé, mais historique commun non synchronisé', 'error');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || left === '' || right === '' ||
        !Number.isSafeInteger(Number(left)) || !Number.isSafeInteger(Number(right)) ||
        Number(left) < 0 || Number(right) < 0) {
      display('Historique non enregistré : renseigner les prises UAG et UAD', 'error');
      return;
    }
    const existing = state.remote[day];
    const input = {
      date:day,
      l_picks:Number(left),
      r_picks:Number(right),
      revision:existing?.revision ?? null
    };
    try {
      display('Enregistrement du bilan dans l’historique commun…', 'loading');
      const response = await fetch(url, {
        method:'POST',
        headers:authHeaders(state.token, {'Content-Type':'application/json'}),
        body:JSON.stringify(input),
        cache:'no-store'
      });
      const data = await jsonResponse(response);
      if (!data.record) throw new Error('Réponse incomplète');
      state.remote[day] = {
        l_picks:String(data.record.l_picks),
        r_picks:String(data.record.r_picks),
        revision:data.record.revision,
        updated_at:data.record.updated_at
      };
      state.lastRefresh = Date.now();
      display('Historique partagé enregistré · ' + day.split('-').reverse().join('/'), 'ok');
    } catch(error) {
      if (error.httpStatus === 409) {
        display('Un autre manager a modifié ce jour · Actualiser avant correction', 'error');
      } else if (error.httpStatus === 401) {
        display('Code expiré ou incorrect · Se reconnecter', 'error');
      } else {
        display('Bilan partagé, mais enregistrement commun non confirmé · Réessayer', 'error');
      }
    }
  };

  function localImportRows() {
    // Uniquement les six jours déjà présents sur CET appareil.
    const local = typeof records === 'function' ? records() : {};
    return Object.entries(local)
      .filter(([day,r])=>/^\d{4}-\d{2}-\d{2}$/.test(day) &&
        /^\d+$/.test(String(r.l_picks??'')) && /^\d+$/.test(String(r.r_picks??'')))
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .slice(-6);
  }
  importButton?.addEventListener('click', async () => {
    if (!state.ready) return;
    const candidates = localImportRows();
    if (!candidates.length) return;
    if (!window.confirm('Importer dans l’historique commun les ' + candidates.length +
        ' dernière(s) journée(s) de CE téléphone ? Les journées déjà enregistrées par d’autres managers ne seront pas écrasées.')) return;
    importButton.disabled = true;
    let added=0,skipped=0;
    try {
      for(const [day, record] of candidates) {
        if(state.remote[day]) {skipped++;continue;}
        const response = await fetch(url,{
          method:'POST',
          headers:authHeaders(state.token, {'Content-Type':'application/json'}),
          body:JSON.stringify({date:day,l_picks:Number(record.l_picks),r_picks:Number(record.r_picks),revision:null}),
          cache:'no-store'
        });
        if(response.ok) added++;
        else skipped++;
      }
      await refreshWith(state.token,true);
      display('Import terminé · ' + added + ' jour(s) ajoutés, ' + skipped + ' ignoré(s)', 'ok');
    } catch {
      display('Import interrompu · Vérifier la connexion puis actualiser', 'error');
    } finally {
      importButton.disabled = false;
    }
  });

  open.addEventListener('click', () => {
    if (state.ready) {
      refreshWith(state.token,true).catch(()=>{});
    } else {
      form.hidden = !form.hidden;
      if(!form.hidden)codeInput.focus();
    }
  });
  cancel.addEventListener('click',()=>{form.hidden=true;codeInput.value='';});
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const token = codeInput.value.trim();
    if(token.length < 12) {display('Saisir le code d’accès complet de l’équipe', 'error');return;}
    const submit=form.querySelector('[type="submit"]');
    submit.disabled=true;
    try {
      await refreshWith(token,true);
      localStorage.setItem(savedTokenKey,token);
      codeInput.value='';
      form.hidden=true;
    } catch {
      // État d'erreur déjà expliqué dans le bandeau ; ne rien enregistrer.
    } finally {submit.disabled=false;}
  });
  document.addEventListener('visibilitychange',()=>{
    if (document.visibilityState === 'visible' && state.token &&
        Date.now() - state.lastRefresh > 120000) refreshWith(state.token,false).catch(()=>{});
  });
  if (state.token) refreshWith(state.token,false).catch(()=>{});
  else {
    display('Historique commun · Se connecter une fois par téléphone', 'idle');
    open.textContent = 'Se connecter';
  }
})();