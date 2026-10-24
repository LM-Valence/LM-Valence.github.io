/**
 * Historique partagé UAG/UAD sur le classeur LM Pilot existant.
 * Aucun compte ni mot de passe demandé dans le bilan.
 *
 * Le propriétaire du script distribue UNE FOIS un lien privé
 * .../bilan/#bilan-historique=<secret>. Le code est conservé dans le
 * stockage privé du navigateur ; il n'apparaît JAMAIS dans GitHub.
 *
 * Sans URL de service ou sans activation, l'application reste inchangée.
 */
(function () {
  'use strict';
  const api = String(window.BILAN_GOOGLE_SCRIPT_URL || '').trim();
  if (!/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/)?macros\/s\/[^/?#]+\/exec(?:\?[^#]*)?$/.test(api)
      && !/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/)?s\/[^/?#]+\/exec(?:\?[^#]*)?$/.test(api)) return;

  const TOKEN_KEY = 'bilan_valence_history_access_v1';
  const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
  const element = id => document.getElementById(id);
  const panel = element('historySharedPanel');
  const status = element('historySharedStatus');
  const open = element('historySharedOpen');
  const auth = element('historySharedForm');
  const importButton = element('historyImport');
  const selectedDate = element('date');
  if (!panel || !status || !selectedDate) return;

  if (open) open.hidden = true;
  if (auth) auth.hidden = true;
  if (importButton) importButton.hidden = true;
  panel.hidden = false;

  const state = {
    token:'',
    ready:false,
    records:{},
    loading:null,
    latestLoaded:'',
    nextCallback:0
  };
  const privateHash = '#bilan-historique=';
  if (window.location.hash.startsWith(privateHash)) {
    const fragment = window.location.hash.slice(privateHash.length);
    const tokenFromLink = decodeURIComponent(fragment);
    if (TOKEN_PATTERN.test(tokenFromLink)) {
      try {
        window.localStorage.setItem(TOKEN_KEY, tokenFromLink);
        window.history?.replaceState?.(null,'',window.location.pathname + window.location.search);
      } catch (_) {
        // Si le navigateur bloque le stockage, l'activation reste en mémoire jusqu'à fermeture.
      }
      state.token = tokenFromLink;
    }
  }
  if (!state.token) {
    try {
      const stored = window.localStorage.getItem(TOKEN_KEY) || '';
      if (TOKEN_PATTERN.test(stored)) state.token = stored;
    } catch (_) {}
  }

  function setStatus(message, tone) {
    status.textContent = message;
    panel.dataset.status = tone || 'idle';
  }
  function buildUrl(params) {
    const prefix = api.includes('?') ? '&' : '?';
    const extra = Object.entries(params)
      .map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(String(v)))
      .join('&');
    return api + prefix + 'bilan=history&' + extra;
  }
  function validRecord(row) {
    return row && typeof row.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
      Number.isSafeInteger(row.l_picks) && row.l_picks >= 0 &&
      Number.isSafeInteger(row.r_picks) && row.r_picks >= 0 &&
      Number.isSafeInteger(row.revision) && row.revision >= 1;
  }
  function apiRead(date) {
    return new Promise((resolve,reject) => {
      const name = '__bv_history_cb_' + (++state.nextCallback) + '_' + Date.now();
      const script = document.createElement('script');
      let finished = false;
      const cleanup = () => {
        if (finished) return false;
        finished = true;
        clearTimeout(timeout);
        script.onerror = null;
        script.remove();
        try { delete window[name]; } catch (_) {window[name]=undefined;}
        return true;
      };
      const timeout = setTimeout(() => {
        if (cleanup()) reject(new Error('Délai de synchronisation dépassé'));
      },15000);
      window[name] = data => {
        if (!cleanup()) return;
        if (data?.ok !== true || !Array.isArray(data.records)) {
          reject(new Error(data?.error || 'Impossible de charger les données communes'));
        } else {
          resolve(data.records);
        }
      };
      script.referrerPolicy = 'no-referrer';
      script.async = true;
      script.onerror = () => {
        if (cleanup()) reject(new Error('Service historique indisponible'));
      };
      script.src = buildUrl({
        action:'read',
        k:state.token,
        to:date || selectedDate.value,
        callback:name,
        ts:Date.now()
      });
      document.head.appendChild(script);
    });
  }

  async function refresh(force) {
    if (!state.token) return false;
    if (state.loading && !force) return state.loading;
    const to = selectedDate.value;
    const work = (async () => {
      setStatus('Mise à jour des six derniers jours…','loading');
      try {
        const rows = await apiRead(to);
        const next = {};
        for (const r of rows) {
          if (validRecord(r)) next[r.date] = {
            l_picks:String(r.l_picks),
            r_picks:String(r.r_picks),
            revision:r.revision,
            updated_at:r.updated_at || ''
          };
        }
        state.records = next;
        state.ready = true;
        state.latestLoaded = to;
        const count = Object.keys(next).length;
        setStatus('Historique commun synchronisé · '+count+' journée(s)','ok');
        return true;
      } catch(error) {
        state.ready = false;
        setStatus('Historique commun indisponible · données locales seulement','error');
        return false;
      }
    })();
    state.loading = work;
    try {return await work;}
    finally {if(state.loading === work)state.loading=null;}
  }

  // Cette fonction est appelée par le générateur PNG ; aucun accès réseau
  // à cet instant afin de conserver l'activation du menu Partager Android.
  window.sharedHistoryRows = function (day) {
    if (!state.ready || state.latestLoaded !== day) return null;
    const rows = {...state.records};
    const l = element('l_picks')?.value.trim() || '';
    const r = element('r_picks')?.value.trim() || '';
    if (/^\d+$/.test(l) && /^\d+$/.test(r) &&
        Number.isSafeInteger(Number(l)) && Number.isSafeInteger(Number(r))) {
      rows[day] = {
        ...(rows[day] || {}),
        l_picks:l,r_picks:r
      };
    }
    return rows;
  };

  // L'écriture est effectuée après la validation du partage (ou du PNG).
  // sendBeacon garde la requête active même si le téléphone passe en arrière-plan.
  async function publish() {
    if (!state.token) return;
    const day=selectedDate.value;
    const l=element('l_picks')?.value.trim() || '';
    const r=element('r_picks')?.value.trim() || '';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day) ||
       !/^\d+$/.test(l)||!/^\d+$/.test(r) ||
       Number(l)>10000000||Number(r)>10000000) return;
    if (!state.ready || state.latestLoaded !== day) {
      const ok = await refresh(true);
      if (!ok) return;
    }
    const current = state.records[day];
    if(current && Number(current.l_picks)===Number(l) &&
       Number(current.r_picks)===Number(r)) return;

    const data = {
      k:state.token,
      date:day,
      l_picks:Number(l),
      r_picks:Number(r),
      revision:current?.revision ?? null
    };
    setStatus('Enregistrement du bilan dans l’historique commun…','loading');
    const endpoint=buildUrl({action:'write'});
    try {
      const payload = new Blob([JSON.stringify(data)],{type:'text/plain;charset=UTF-8'});
      const sent = typeof navigator.sendBeacon==='function' &&
        navigator.sendBeacon(endpoint,payload);
      if (!sent) {
        // Requête simple sans CORS ; la confirmation provient de la relecture.
        await fetch(endpoint,{
          method:'POST',mode:'no-cors',redirect:'follow',
          body:payload,keepalive:true
        });
      }
      let found = false, conflict = false;
      for (let attempt=0;attempt<4;attempt++) {
        await new Promise(resolve=>setTimeout(resolve,500+attempt*600));
        const ok=await refresh(true);
        if (!ok) continue;
        const got=state.records[day];
        if(got && Number(got.l_picks)===Number(l) &&
           Number(got.r_picks)===Number(r)) {
          found=true;
          break;
        }
        if(got && got.revision !== (current?.revision ?? null)) {
          conflict=true;
          break;
        }
      }
      if (found) setStatus('Historique commun enregistré · '+day.split('-').reverse().join('/'),'ok');
      else if (conflict) setStatus('Jour déjà modifié par un autre manager · Historique non écrasé','error');
      else setStatus('Partage effectué · Enregistrement commun non confirmé','error');
    }catch(error) {
      setStatus('Partage effectué · Enregistrement commun indisponible','error');
    }
  }
  window.sharedHistoryPublish = publish;

  selectedDate.addEventListener('change',()=>{refresh(true);});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible' && state.token &&
       !state.loading) refresh(true);
  });
  if (state.token) refresh(false);
  else setStatus('Historique commun non activé sur ce téléphone · liaison privée nécessaire','error');
})();