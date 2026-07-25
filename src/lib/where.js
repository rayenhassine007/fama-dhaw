// Zone approximative déduite de l'IP, sans aucune permission demandée.
//
// Sert à pré-remplir l'affichage dès la première seconde. Ne débloque JAMAIS le
// signalement : une IP est une indication, pas une preuve de présence (§2.2).
// Échoue silencieusement — l'utilisateur garde la liste nationale de toute façon.

import { USE_API, apiGet } from './api.js';

export async function fetchIpZone() {
  if (!USE_API) return null; // mode démo : pas de route serveur
  try {
    const d = await apiGet('/api/where');
    return d && d.ok ? d : null;
  } catch {
    return null;
  }
}
