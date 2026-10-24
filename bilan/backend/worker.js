/**
 * Bilan Valence - Historique commun des reliquats (Cloudflare Worker + D1).
 * Seules les dates et prises restantes UAG/UAD sont enregistrées.
 *
 * Configuration requise (hors dépôt public) :
 * - Binding D1 : env.HISTORY_DB
 * - Secret Worker : env.HISTORY_ACCESS_TOKEN (phrase longue et privée)
 * Ne jamais intégrer le secret dans les fichiers GitHub Pages.
 */
const ALLOWED_ORIGIN = 'https://lm-valence.github.io';
const MAX_PICKS = 10000000;

function respond(request, value, status = 200) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'Vary': 'Origin',
  };
  if (origin === ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Max-Age'] = '600';
  }
  return new Response(status === 204 ? null : JSON.stringify(value), {status, headers});
}
function validDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const d = new Date(day + 'T00:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== day) return false;
  const now = Date.now();
  return d.getTime() >= now - 366 * 2 * 86400000 && d.getTime() <= now + 7 * 86400000;
}
function validPicks(n) {
  return Number.isSafeInteger(n) && n >= 0 && n <= MAX_PICKS;
}
function mapRecord(r) {
  return {date:r.day,l_picks:r.l_picks,r_picks:r.r_picks,revision:r.revision,updated_at:r.updated_at};
}
async function readCurrent(db, day) {
  return db.prepare('SELECT day,l_picks,r_picks,revision,updated_at FROM daily_history WHERE day=?')
    .bind(day).first();
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (origin && origin !== ALLOWED_ORIGIN) {
      return respond(request, {error:'Origine non autorisée'}, 403);
    }
    if (request.method === 'OPTIONS') return respond(request, null, 204);
    const url = new URL(request.url);
    if (url.pathname !== '/api/history' || !['GET','POST'].includes(request.method)) {
      return respond(request, {error:'Route introuvable'}, 404);
    }
    if (!env.HISTORY_DB || !env.HISTORY_ACCESS_TOKEN || env.HISTORY_ACCESS_TOKEN.length < 12) {
      return respond(request, {error:'Service non configuré'}, 503);
    }
    const supplied = request.headers.get('Authorization') || '';
    if (supplied !== 'Bearer ' + env.HISTORY_ACCESS_TOKEN) {
      return respond(request, {error:'Code d’accès incorrect'}, 401);
    }

    try {
      if (request.method === 'GET') {
        const amount = Math.max(6, Math.min(180, Number(url.searchParams.get('limit')) || 90));
        const query = await env.HISTORY_DB.prepare(
          'SELECT day,l_picks,r_picks,revision,updated_at FROM daily_history ORDER BY day DESC LIMIT ?'
        ).bind(amount).all();
        const rows = (query.results || []).reverse().map(mapRecord);
        return respond(request, {records:rows});
      }

      if (Number(request.headers.get('Content-Length')) > 1000) {
        return respond(request, {error:'Requête trop volumineuse'}, 413);
      }
      const body = await request.json().catch(()=>null);
      if (!body || !validDay(body.date) || !validPicks(body.l_picks) || !validPicks(body.r_picks) ||
          !(body.revision === null || (Number.isSafeInteger(body.revision) && body.revision >= 1))) {
        return respond(request, {error:'Date, valeurs ou version non valides'}, 400);
      }
      const {date,l_picks,r_picks,revision} = body;
      const current = await readCurrent(env.HISTORY_DB, date);
      if (current && current.l_picks === l_picks && current.r_picks === r_picks) {
        return respond(request, {ok:true,record:mapRecord(current),unchanged:true});
      }
      if ((current?.revision ?? null) !== revision) {
        return respond(request, {error:'Un autre bilan a déjà été enregistré pour cette date. Actualisez l’historique avant de le modifier.'}, 409);
      }
      const changedAt = new Date().toISOString();
      if (current === null) {
        const inserted = await env.HISTORY_DB.prepare(
          'INSERT OR IGNORE INTO daily_history (day,l_picks,r_picks,revision,updated_at) VALUES (?,?,?,1,?)'
        ).bind(date,l_picks,r_picks,changedAt).run();
        if (inserted.meta?.changes !== 1) {
          return respond(request, {error:'Un bilan a été enregistré entre-temps. Actualisez.'}, 409);
        }
      } else {
        const updated = await env.HISTORY_DB.prepare(
          'UPDATE daily_history SET l_picks=?,r_picks=?,revision=revision+1,updated_at=? WHERE day=? AND revision=?'
        ).bind(l_picks,r_picks,changedAt,date,revision).run();
        if (updated.meta?.changes !== 1) {
          return respond(request, {error:'Le bilan a été modifié entre-temps. Actualisez.'}, 409);
        }
      }
      const result = await readCurrent(env.HISTORY_DB, date);
      return respond(request, {ok:true,record:mapRecord(result)}, 200);
    } catch (error) {
      console.error('Shared history request failed', error?.message || error);
      return respond(request, {error:'Erreur du service d’historique. Réessayez.'}, 500);
    }
  }
};
