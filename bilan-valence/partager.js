/* Bilan Valence : partage temporaire depuis l'application Google interne.
 * Le PNG reste en mémoire du navigateur ; pas de stockage ni d'envoi à un backend.
 * Les applis Teams et e-mail ne reçoivent l'image qu'au collage volontaire. */
(() => {
  'use strict';
  const status = document.getElementById('status');
  const copyButton = document.getElementById('copy');
  const shareButton = document.getElementById('share');
  const downloadLink = document.getElementById('download');
  const teamsLink = document.getElementById('teams');
  const emailLink = document.getElementById('email');
  const token = decodeURIComponent(location.hash.slice(1));
  const originOK = origin => origin === 'https://script.google.com' ||
    origin === 'https://script.googleusercontent.com' ||
    /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin);
  let ready = false;
  let file = null;
  let objectUrl = '';
  const message = text => { status.textContent = text; };
  let poll;
  const receive = event => {
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
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((n,i) => arr[i] === n)) {
      message('Image invalide. Revenez au formulaire et utilisez PNG.');
      return;
    }
    file = new File([arr], 'Bilan_Valence_' + d.date + '.png', {type:'image/png'});
    objectUrl = URL.createObjectURL(file);
    downloadLink.href = objectUrl;
    downloadLink.download = file.name;
    downloadLink.hidden = false;
    shareButton.disabled = false;
    copyButton.disabled = false;
    teamsLink.hidden = false;
    emailLink.hidden = false;
    emailLink.href = 'mailto:?subject=' +
      encodeURIComponent('Bilan de fin de journée - Entrepôt Valence - ' +
        d.date.split('-').reverse().join('/'));
    message('Image prête. Copiez-la pour la coller dans Teams ou dans votre e-mail.');
    history.replaceState(null, '', location.pathname);
  };
  window.addEventListener('message', receive);
  const requestImage = () => {
    try { window.opener?.postMessage({type:'BV_SHARE_READY', token}, '*'); }
    catch (_) {}
  };
  if (!window.opener || !token || token.length > 120) {
    message('Ouvrez le bilan interne et cliquez sur « Partager ».');
  } else {
    poll = setInterval(() => { if (!ready) requestImage(); }, 500);
    requestImage();
    setTimeout(() => {
      if (!ready) {
        clearInterval(poll);
        message('Image non reçue. Revenez au bilan, puis utilisez le bouton PNG.');
      }
    }, 12000);
  }
  copyButton.addEventListener('click', async () => {
    if (!file) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      message('Copie non disponible sur ce poste. Téléchargez le PNG puis joignez-le au message.');
      return;
    }
    copyButton.disabled = true;
    try {
      await navigator.clipboard.write([new ClipboardItem({'image/png':file})]);
      message('Image copiée ! Ouvrez Teams ou votre e-mail, puis faites Ctrl + V dans le message.');
      copyButton.textContent = '✓ Image copiée — recoller si besoin';
    } catch (_) {
      message('La copie est bloquée par le navigateur ou les règles du PC. Utilisez « Télécharger le PNG » puis joignez le fichier.');
    } finally {
      copyButton.disabled = false;
    }
  });
  shareButton.addEventListener('click', () => {
    if (!file) return;
    if (typeof navigator.share !== 'function' ||
        (navigator.canShare && !navigator.canShare({files:[file]}))) {
      message('Le menu de partage n’est pas disponible ici. Utilisez « Copier l’image » ou « Télécharger le PNG ».');
      return;
    }
    try {
      Promise.resolve(navigator.share({
        files:[file], title:'Bilan de fin de journée · Entrepôt Valence',
        text:'Bilan UAG / UAD du ' + file.name.slice(14,24).split('-').reverse().join('/')
      })).then(() => {
        message('Menu de partage ouvert. Sélectionnez votre application et confirmez l’envoi.');
      }).catch(e => {
        message(e?.name==='AbortError'
          ? 'Partage annulé. Vous pouvez copier l’image pour Teams ou un e-mail.'
          : 'Partage non disponible. Utilisez « Copier l’image » ou « Télécharger le PNG ».');
      });
    } catch (_) {
      message('Partage bloqué. Utilisez « Copier l’image » ou « Télécharger le PNG ».');
    }
  });
  window.addEventListener('pagehide', () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });
})();
