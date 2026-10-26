/* Bilan Valence — partage Android côté navigateur uniquement.
   L'image est transmise de l'application Google interne par postMessage
   avec vérification de l'origine, et n'est envoyée à aucun serveur. */
(() => {
  'use strict';
  const status = document.getElementById('status');
  const share = document.getElementById('share');
  const download = document.getElementById('download');
  const token = decodeURIComponent(location.hash.slice(1));
  const originOK = origin => origin === 'https://script.google.com' ||
    origin === 'https://script.googleusercontent.com' ||
    /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin);
  let ready = false;
  let file = null;
  let objectUrl = '';
  const message = text => { status.textContent = text; };
  const listener = event => {
    if (ready || !window.opener || event.source !== window.opener ||
        !originOK(event.origin)) return;
    const d = event.data;
    if (!d || d.type !== 'BV_SHARE_IMAGE' || d.token !== token ||
        !(d.bytes instanceof ArrayBuffer) || d.bytes.byteLength < 100 ||
        d.bytes.byteLength > 20000000 || typeof d.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return;
    ready = true;
    clearInterval(poll);
    const arr = new Uint8Array(d.bytes);
    // Signature PNG, évite de partager accidentellement un contenu inattendu.
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((n,i) => arr[i] === n)) {
      message('Image non valide. Revenez au formulaire et utilisez PNG.');
      return;
    }
    file = new File([arr], 'Bilan_Valence_' + d.date + '.png',
      {type:'image/png'});
    objectUrl = URL.createObjectURL(file);
    download.href = objectUrl;
    download.download = file.name;
    download.hidden = false;
    share.disabled = false;
    message('Votre image est prête. Appuyez sur « Partager le PNG » pour choisir Teams, Outlook ou une autre application.');
    history.replaceState(null, '', location.pathname);
  };
  window.addEventListener('message', listener);
  const sendReady = () => {
    try {
      window.opener?.postMessage({type:'BV_SHARE_READY',token}, '*');
    } catch (_) {}
  };
  const poll = setInterval(() => { if (!ready) sendReady(); }, 500);
  if (!window.opener || !token || token.length > 120) {
    clearInterval(poll);
    message('Ouvrez le bilan interne et utilisez son bouton « Partager ».');
  } else {
    sendReady();
    setTimeout(() => {
      if (!ready) {
        clearInterval(poll);
        message('L’image n’a pas pu être récupérée. Revenez au bilan et utilisez « PNG ».');
      }
    }, 12000);
  }
  share.addEventListener('click', () => {
    if (!file) return;
    if (typeof navigator.share !== 'function' ||
        (navigator.canShare && !navigator.canShare({files:[file]}))) {
      message('Votre navigateur ne permet pas de partager cette image directement. Utilisez « Télécharger le PNG ».');
      return;
    }
    try {
      const sending = navigator.share({
        files:[file], title:'Bilan de fin de journée · Entrepôt Valence',
        text:'Bilan UAG / UAD du ' + file.name.slice(14,24).split('-').reverse().join('/')
      });
      Promise.resolve(sending).then(() => message('Image transmise à l’application sélectionnée.'))
        .catch(e => {
          if (e?.name === 'AbortError') {
            message('Partage annulé. Vous pouvez réessayer.');
          } else {
            message('Partage indisponible. Utilisez « Télécharger le PNG » si nécessaire.');
          }
        });
    } catch (_) {
      message('Partage indisponible. Utilisez « Télécharger le PNG » si nécessaire.');
    }
  });
  window.addEventListener('pagehide', () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });
})();
