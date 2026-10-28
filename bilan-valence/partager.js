/* Bilan Valence : transfert de PNG temporaire entre Google Apps Script
 * et cette page de partage. Aucune donnée métier stockée ou téléversée ici. */
(() => {
  'use strict';
  const status = document.getElementById('status');
  const gmail = document.getElementById('gmail');
  const chat = document.getElementById('chat');
  const token = decodeURIComponent(location.hash.slice(1));
  const originOK = origin => origin === 'https://script.google.com' ||
    origin === 'https://script.googleusercontent.com' ||
    /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let ready = false, file = null, url = '', poll;
  const message = text => { status.textContent = text; };
  const receive = event => {
    if (ready || !window.opener || event.source !== window.opener ||
        !originOK(event.origin)) return;
    const d = event.data;
    if (!d || d.type !== 'BV_SHARE_IMAGE' || d.token !== token ||
        !(d.bytes instanceof ArrayBuffer) || d.bytes.byteLength < 100 ||
        d.bytes.byteLength > 20000000 ||
        typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return;
    ready = true;
    clearInterval(poll);
    const bytes = new Uint8Array(d.bytes);
    const sig = [137,80,78,71,13,10,26,10];
    if (!sig.every((n,i) => bytes[i]===n)) {
      message('Image invalide. Revenez au bilan et utilisez le bouton PNG.');return;
    }
    file = new File([bytes],'Bilan_Valence_'+d.date+'.png',{type:'image/png'});
    url = URL.createObjectURL(file);
    gmail.disabled = false;
    chat.disabled = false;
    message('Image prête. Choisissez Gmail ou Google Chat.');
    history.replaceState(null,'',location.pathname);
  };
  window.addEventListener('message',receive);
  const request = () => {
    try { window.opener?.postMessage({type:'BV_SHARE_READY',token},'*'); }catch(_) {}
  };
  if (!window.opener || !token || token.length > 120) {
    message('Ouvrez Bilan Valence Interne puis cliquez sur Partager.');
  } else {
    poll = setInterval(() => { if (!ready) request(); },500);
    request();
    setTimeout(() => {
      if (!ready) {
        clearInterval(poll);
        message('Image non reçue. Revenez au bilan et utilisez le bouton PNG.');
      }
    },12000);
  }
  function downloadPNG() {
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a);a.click();a.remove();
  }
  function start(target) {
    if (!file) return;
    const isGmail = target === 'gmail';
    const service = isGmail?'Gmail':'Google Chat';
    const date = file.name.slice(14,24).split('-').reverse().join('/');
    const link = isGmail
      ? 'https://mail.google.com/mail/?view=cm&fs=1&su='+
          encodeURIComponent('Bilan de fin de journée - Entrepôt Valence - '+date)
      : 'https://chat.google.com/';
    // Web Share ne permet pas de choisir l'application à la place d'Android.
    // Sur mobile, le fichier est confié à la feuille native de partage.
    if (isMobile && typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare({files:[file]}))) {
      try {
        Promise.resolve(navigator.share({
          files:[file],
          title:'Bilan de fin de journée · Entrepôt Valence',
          text:'Bilan UAG / UAD du '+date
        })).then(() => {
          message('Le bilan a été remis à l’application sélectionnée. Vérifiez le destinataire avant l’envoi.');
        }).catch(err => {
          if (err?.name==='AbortError') message('Partage annulé. Choisissez Gmail ou Google Chat pour réessayer.');
          else manual();
        });
        message('Dans le menu Android, sélectionnez '+service+' pour joindre le PNG.');
        return;
      }catch(_) {}
    }
    manual();
    function manual() {
      // Un lien web n'ajoute pas de pièce jointe à Gmail ou Google Chat.
      // Ce téléchargement est fait à la demande explicite de l'utilisateur.
      try { downloadPNG(); } catch (_) {
        message('Téléchargement bloqué. Revenez au bilan et utilisez PNG.');return;
      }
      message('PNG téléchargé. Ouvrez '+service+', joignez le fichier et envoyez votre message.');
      const next = window.open(link,'_blank');
      if (next) {
        try { next.opener = null; } catch (_) {}
      } else {
        // Si les nouveaux onglets sont interdits, garder un accès au service.
        window.location.assign(link);
      }
    }
  }
  gmail.addEventListener('click',() => start('gmail'));
  chat.addEventListener('click',() => start('chat'));
  window.addEventListener('pagehide',() => {if(url)URL.revokeObjectURL(url);});
})();
