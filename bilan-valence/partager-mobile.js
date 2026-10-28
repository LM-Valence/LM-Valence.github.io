/* Partage mobile de Bilan Valence depuis une page HTTPS hors iframe Google.
 * Image PNG temporaire transmise depuis le formulaire par postMessage validé.
 * Aucun appel réseau, aucun stockage, aucun envoi automatique. */
(() => {
  'use strict';
  const status = document.getElementById('status');
  const share = document.getElementById('share');
  const download = document.getElementById('download');
  const token = decodeURIComponent(location.hash.slice(1));
  const allowedOrigin = origin => origin === 'https://script.google.com' ||
    origin === 'https://script.googleusercontent.com' ||
    /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin);
  let received = false, file = null, url = '', poll;
  const note = text => {status.textContent = text;};
  function receive(event) {
    if(received || !window.opener || event.source !== window.opener ||
      !allowedOrigin(event.origin))return;
    const payload = event.data;
    if(!payload || payload.type !== 'BV_SHARE_IMAGE' || payload.token !== token ||
      !(payload.bytes instanceof ArrayBuffer) ||
      payload.bytes.byteLength < 100 || payload.bytes.byteLength > 20000000 ||
      typeof payload.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.date))return;
    received = true;
    clearInterval(poll);
    const bytes = new Uint8Array(payload.bytes);
    if(![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)) {
      note('Le PNG n’est pas valide. Revenez au bilan et utilisez ↓ PNG.');
      return;
    }
    file = new File([bytes],'Bilan_Valence_'+payload.date+'.png',{type:'image/png'});
    url = URL.createObjectURL(file);
    download.href = url; download.download = file.name;
    download.hidden = false;
    share.disabled = false;
    note('Image prête. Appuyez sur « Partager le PNG » pour choisir votre application.');
    history.replaceState(null,'',location.pathname);
  }
  window.addEventListener('message',receive);
  function request() {
    try {window.opener?.postMessage({type:'BV_SHARE_READY',token},'*');} catch (_) {}
  }
  if(!window.opener || !token || token.length > 120) {
    note('Revenez au bilan et cliquez sur « Partager ».');
  } else {
    poll = setInterval(()=>{if(!received)request();},500);
    request();
    setTimeout(()=>{
      if(!received) {
        clearInterval(poll);
        note('Image non reçue. Revenez au bilan et utilisez ↓ PNG.');
      }
    },12000);
  }
  share.addEventListener('click',()=>{
    if(!file)return;
    if(typeof navigator.share!=='function' ||
      (navigator.canShare&&!navigator.canShare({files:[file]}))) {
      note('Le navigateur ne permet pas le partage direct : utilisez « Télécharger le PNG ».');
      return;
    }
    share.disabled = true;
    try {
      // Toujours appeler navigator.share directement dans le clic utilisateur.
      const promise = navigator.share({
        files:[file], title:'Bilan de fin de journée · Entrepôt Valence'
      });
      Promise.resolve(promise)
        .then(()=>note('Partage ouvert. Vérifiez le destinataire avant l’envoi.'))
        .catch(e=>note(e?.name==='AbortError'
          ? 'Partage annulé. Vous pouvez réessayer.'
          : 'Partage indisponible. Utilisez « Télécharger le PNG ».'))
        .finally(()=>{share.disabled=false;});
    } catch (_) {
      share.disabled=false;
      note('Partage indisponible. Utilisez « Télécharger le PNG ».');
    }
  });
  window.addEventListener('pagehide',()=>{if(url)URL.revokeObjectURL(url);});
})();
