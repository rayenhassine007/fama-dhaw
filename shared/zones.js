// Full national zone list, transcribed from the competitor's app (all
// governorates). Each zone is a name + an approximate center point; a GPS
// position belongs to the nearest centroid (Voronoi). Shared by BOTH the client
// (display) and the server API (authoritative GPS -> zone), so assignment is
// identical on both sides. The client never sends its zone id — the server
// re-derives it from the GPS (spec §8), which is also why a user cannot "reach"
// another zone by name: identity is the location, names are display-only.
//
// Coordinates are APPROXIMATE (esp. dense Tunis micro-neighbourhoods) and meant
// to be refined with official TN data. Zone SET matches the competitor exactly.

export const ZONES = [
  // — Tunis —
  { id: 'tunis-ain-zaghouan', name: 'Aïn Zaghouan', gov: 'Tunis', lat: 36.858, lng: 10.27 },
  { id: 'tunis-ain-zaghouan-nord', name: 'Aïn Zaghouan Nord', gov: 'Tunis', lat: 36.866, lng: 10.276 },
  { id: 'tunis-alain-savary', name: 'Alain Savary', gov: 'Tunis', lat: 36.835, lng: 10.205 },
  { id: 'tunis-bab-el-khadhra', name: 'Bab El Khadhra', gov: 'Tunis', lat: 36.812, lng: 10.176 },
  { id: 'tunis-bab-jdid', name: 'Bab Jdid', gov: 'Tunis', lat: 36.795, lng: 10.17 },
  { id: 'tunis-bab-saadoun', name: 'Bab Saadoun', gov: 'Tunis', lat: 36.811, lng: 10.16 },
  { id: 'tunis-bab-souika', name: 'Bab Souika', gov: 'Tunis', lat: 36.81, lng: 10.168 },
  { id: 'tunis-bellevue', name: 'Bellevue', gov: 'Tunis', lat: 36.82, lng: 10.19 },
  { id: 'tunis-berges-du-lac-1', name: 'Berges du Lac 1', gov: 'Tunis', lat: 36.835, lng: 10.245 },
  { id: 'tunis-berges-du-lac-2', name: 'Berges du Lac 2', gov: 'Tunis', lat: 36.846, lng: 10.27 },
  { id: 'tunis-berges-du-lac-3-kheireddine', name: 'Berges du Lac 3 (Kheireddine)', gov: 'Tunis', lat: 36.856, lng: 10.29 },
  { id: 'tunis-bhar-lazreg', name: 'Bhar Lazreg', gov: 'Tunis', lat: 36.866, lng: 10.315 },
  { id: 'tunis-borj-chakir', name: 'Borj Chakir', gov: 'Tunis', lat: 36.76, lng: 10.08 },
  { id: 'tunis-bouchoucha', name: 'Bouchoucha', gov: 'Tunis', lat: 36.808, lng: 10.185 },
  { id: 'tunis-carthage-sidi-bou-said-autre', name: 'Carthage / Sidi Bou Saïd (autre)', gov: 'Tunis', lat: 36.866, lng: 10.336 },
  { id: 'tunis-carthage-amilcar', name: 'Carthage Amilcar', gov: 'Tunis', lat: 36.855, lng: 10.32 },
  { id: 'tunis-carthage-byrsa', name: 'Carthage Byrsa', gov: 'Tunis', lat: 36.852, lng: 10.323 },
  { id: 'tunis-carthage-dermech', name: 'Carthage Dermech', gov: 'Tunis', lat: 36.856, lng: 10.325 },
  { id: 'tunis-carthage-hannibal', name: 'Carthage Hannibal', gov: 'Tunis', lat: 36.858, lng: 10.328 },
  { id: 'tunis-carthage-mohamed-ali', name: 'Carthage Mohamed Ali', gov: 'Tunis', lat: 36.853, lng: 10.327 },
  { id: 'tunis-carthage-presidence', name: 'Carthage Présidence', gov: 'Tunis', lat: 36.861, lng: 10.331 },
  { id: 'tunis-carthage-salammbo', name: 'Carthage Salammbô', gov: 'Tunis', lat: 36.845, lng: 10.318 },
  { id: 'tunis-carthage-yasmina', name: 'Carthage Yasmina', gov: 'Tunis', lat: 36.85, lng: 10.331 },
  { id: 'tunis-centre-urbain-nord', name: 'Centre Urbain Nord', gov: 'Tunis', lat: 36.838, lng: 10.2 },
  { id: 'tunis-centre-ville-lafayette', name: 'Centre-ville / Lafayette', gov: 'Tunis', lat: 36.808, lng: 10.183 },
  { id: 'tunis-charguia-1', name: 'Charguia 1', gov: 'Tunis', lat: 36.828, lng: 10.205 },
  { id: 'tunis-charguia-2', name: 'Charguia 2', gov: 'Tunis', lat: 36.835, lng: 10.215 },
  { id: 'tunis-cite-el-khadra-olympique', name: 'Cité El Khadra / Olympique', gov: 'Tunis', lat: 36.828, lng: 10.195 },
  { id: 'tunis-cite-el-wahat-el-agba', name: 'Cité El Wahat (El Agba)', gov: 'Tunis', lat: 36.8, lng: 10.13 },
  { id: 'tunis-cite-el-wahat-l-aouina', name: 'Cité El Wahat (L\'Aouina)', gov: 'Tunis', lat: 36.845, lng: 10.235 },
  { id: 'tunis-cite-ettahrir', name: 'Cité Ettahrir', gov: 'Tunis', lat: 36.825, lng: 10.135 },
  { id: 'tunis-cite-ezzouhour', name: 'Cité Ezzouhour', gov: 'Tunis', lat: 36.793, lng: 10.147 },
  { id: 'tunis-cite-ibn-khaldoun', name: 'Cité Ibn Khaldoun', gov: 'Tunis', lat: 36.815, lng: 10.145 },
  { id: 'tunis-cite-ibn-sina', name: 'Cité Ibn Sina', gov: 'Tunis', lat: 36.818, lng: 10.15 },
  { id: 'tunis-el-hrairia', name: 'El Hraïria', gov: 'Tunis', lat: 36.771, lng: 10.147 },
  { id: 'tunis-el-menzah-1', name: 'El Menzah 1', gov: 'Tunis', lat: 36.838, lng: 10.175 },
  { id: 'tunis-el-menzah-4', name: 'El Menzah 4', gov: 'Tunis', lat: 36.842, lng: 10.17 },
  { id: 'tunis-el-omrane', name: 'El Omrane', gov: 'Tunis', lat: 36.818, lng: 10.156 },
  { id: 'tunis-el-omrane-superieur', name: 'El Omrane Supérieur', gov: 'Tunis', lat: 36.829, lng: 10.149 },
  { id: 'tunis-el-ouardia-kabaria', name: 'El Ouardia / Kabaria', gov: 'Tunis', lat: 36.762, lng: 10.185 },
  { id: 'tunis-essaida', name: 'Essaidia', gov: 'Tunis', lat: 36.79, lng: 10.235 },
  { id: 'tunis-ezzahrouni', name: 'Ezzahrouni', gov: 'Tunis', lat: 36.808, lng: 10.15 },
  { id: 'tunis-gammarth', name: 'Gammarth', gov: 'Tunis', lat: 36.905, lng: 10.29 },
  { id: 'tunis-gammarth-superieur', name: 'Gammarth Supérieur', gov: 'Tunis', lat: 36.91, lng: 10.285 },
  { id: 'tunis-gammarth-village', name: 'Gammarth Village', gov: 'Tunis', lat: 36.9, lng: 10.296 },
  { id: 'tunis-ghedir-el-golla', name: 'Ghedir El Golla', gov: 'Tunis', lat: 36.87, lng: 10.25 },
  { id: 'tunis-gorjani-9-avril', name: 'Gorjani / 9 Avril', gov: 'Tunis', lat: 36.8, lng: 10.165 },
  { id: 'tunis-hafsia', name: 'Hafsia', gov: 'Tunis', lat: 36.798, lng: 10.172 },
  { id: 'tunis-halfaouine', name: 'Halfaouine', gov: 'Tunis', lat: 36.808, lng: 10.17 },
  { id: 'tunis-jardins-de-carthage-cote-isc-villas', name: 'Jardins de Carthage (côté ISC / villas)', gov: 'Tunis', lat: 36.87, lng: 10.3 },
  { id: 'tunis-jardins-de-carthage-cote-parc-foret', name: 'Jardins de Carthage (côté parc / forêt)', gov: 'Tunis', lat: 36.875, lng: 10.295 },
  { id: 'tunis-jbal-jloud', name: 'Jbal Jloud', gov: 'Tunis', lat: 36.762, lng: 10.21 },
  { id: 'tunis-jbel-lahmar', name: 'Jbel Lahmar', gov: 'Tunis', lat: 36.815, lng: 10.18 },
  { id: 'tunis-khaznadar', name: 'Khaznadar', gov: 'Tunis', lat: 36.815, lng: 10.155 },
  { id: 'tunis-l-aouina', name: 'L\'Aouina', gov: 'Tunis', lat: 36.85, lng: 10.245 },
  { id: 'tunis-la-goulette', name: 'La Goulette', gov: 'Tunis', lat: 36.818, lng: 10.305 },
  { id: 'tunis-la-marsa', name: 'La Marsa', gov: 'Tunis', lat: 36.878, lng: 10.325 },
  { id: 'tunis-la-marsa-plage', name: 'La Marsa Plage', gov: 'Tunis', lat: 36.882, lng: 10.322 },
  { id: 'tunis-la-marsa-ville', name: 'La Marsa Ville', gov: 'Tunis', lat: 36.878, lng: 10.32 },
  { id: 'tunis-le-bardo', name: 'Le Bardo', gov: 'Tunis', lat: 36.809, lng: 10.14 },
  { id: 'tunis-le-kram', name: 'Le Kram', gov: 'Tunis', lat: 36.838, lng: 10.315 },
  { id: 'tunis-le-kram-est', name: 'Le Kram Est', gov: 'Tunis', lat: 36.84, lng: 10.32 },
  { id: 'tunis-le-kram-ouest', name: 'Le Kram Ouest', gov: 'Tunis', lat: 36.836, lng: 10.308 },
  { id: 'tunis-medina', name: 'Médina', gov: 'Tunis', lat: 36.797, lng: 10.171 },
  { id: 'tunis-mellassine', name: 'Mellassine', gov: 'Tunis', lat: 36.795, lng: 10.155 },
  { id: 'tunis-montfleury', name: 'Montfleury', gov: 'Tunis', lat: 36.798, lng: 10.185 },
  { id: 'tunis-montplaisir', name: 'Montplaisir', gov: 'Tunis', lat: 36.818, lng: 10.19 },
  { id: 'tunis-mutuelleville-belvedere', name: 'Mutuelleville / Belvédère', gov: 'Tunis', lat: 36.825, lng: 10.18 },
  { id: 'tunis-ras-tabia', name: 'Ras Tabia', gov: 'Tunis', lat: 36.805, lng: 10.17 },
  { id: 'tunis-sidi-daoud-la-marsa', name: 'Sidi Daoud (La Marsa)', gov: 'Tunis', lat: 36.888, lng: 10.315 },
  { id: 'tunis-sidi-hassine-sejoumi', name: 'Sidi Hassine / Séjoumi', gov: 'Tunis', lat: 36.777, lng: 10.115 },
  // — Ariana —
  { id: 'ariana-ariana-ville', name: 'Ariana Ville', gov: 'Ariana', lat: 36.866, lng: 10.194 },
  { id: 'ariana-borj-baccouche', name: 'Borj Baccouche', gov: 'Ariana', lat: 36.858, lng: 10.2 },
  { id: 'ariana-borj-louzir', name: 'Borj Louzir', gov: 'Ariana', lat: 36.87, lng: 10.215 },
  { id: 'ariana-borj-touil', name: 'Borj Touil', gov: 'Ariana', lat: 36.895, lng: 10.235 },
  { id: 'ariana-chotrana-1', name: 'Chotrana 1', gov: 'Ariana', lat: 36.878, lng: 10.215 },
  { id: 'ariana-chotrana-2', name: 'Chotrana 2', gov: 'Ariana', lat: 36.882, lng: 10.22 },
  { id: 'ariana-chotrana-3', name: 'Chotrana 3', gov: 'Ariana', lat: 36.885, lng: 10.225 },
  { id: 'ariana-cite-borj-turki', name: 'Cité Borj Turki', gov: 'Ariana', lat: 36.86, lng: 10.21 },
  { id: 'ariana-cite-el-faouz', name: 'Cité El Faouz', gov: 'Ariana', lat: 36.86, lng: 10.185 },
  { id: 'ariana-cite-el-ghazela', name: 'Cité El Ghazela', gov: 'Ariana', lat: 36.88, lng: 10.2 },
  { id: 'ariana-cite-ennahli', name: 'Cité Ennahli', gov: 'Ariana', lat: 36.855, lng: 10.17 },
  { id: 'ariana-cite-ennour-jaafar', name: 'Cité Ennour Jaâfar', gov: 'Ariana', lat: 36.87, lng: 10.176 },
  { id: 'ariana-cite-ennozha', name: 'Cité Ennozha', gov: 'Ariana', lat: 36.855, lng: 10.205 },
  { id: 'ariana-cite-essahafa', name: 'Cité Essahafa', gov: 'Ariana', lat: 36.86, lng: 10.212 },
  { id: 'ariana-cite-ettadhamen', name: 'Cité Ettadhamen', gov: 'Ariana', lat: 36.85, lng: 10.098 },
  { id: 'ariana-cite-hedi-nouira', name: 'Cité Hédi Nouira', gov: 'Ariana', lat: 36.865, lng: 10.18 },
  { id: 'ariana-cite-intilaka', name: 'Cité Intilaka', gov: 'Ariana', lat: 36.848, lng: 10.11 },
  { id: 'ariana-cite-jaafar', name: 'Cité Jaafar', gov: 'Ariana', lat: 36.865, lng: 10.174 },
  { id: 'ariana-dar-fadhal', name: 'Dar Fadhal', gov: 'Ariana', lat: 36.88, lng: 10.23 },
  { id: 'ariana-el-manar-1-2', name: 'El Manar 1-2', gov: 'Ariana', lat: 36.84, lng: 10.16 },
  { id: 'ariana-el-manar-3', name: 'El Manar 3', gov: 'Ariana', lat: 36.845, lng: 10.155 },
  { id: 'ariana-el-menzah-5', name: 'El Menzah 5', gov: 'Ariana', lat: 36.845, lng: 10.18 },
  { id: 'ariana-el-menzah-6', name: 'El Menzah 6', gov: 'Ariana', lat: 36.848, lng: 10.184 },
  { id: 'ariana-el-menzah-7', name: 'El Menzah 7', gov: 'Ariana', lat: 36.85, lng: 10.186 },
  { id: 'ariana-el-menzah-8', name: 'El Menzah 8', gov: 'Ariana', lat: 36.852, lng: 10.188 },
  { id: 'ariana-el-menzah-9', name: 'El Menzah 9', gov: 'Ariana', lat: 36.85, lng: 10.191 },
  { id: 'ariana-ennasr-1', name: 'Ennasr 1', gov: 'Ariana', lat: 36.855, lng: 10.165 },
  { id: 'ariana-ennasr-2', name: 'Ennasr 2', gov: 'Ariana', lat: 36.858, lng: 10.17 },
  { id: 'ariana-ennkhilette', name: 'Ennkhilette', gov: 'Ariana', lat: 36.86, lng: 10.16 },
  { id: 'ariana-jardins-d-el-menzah-1', name: 'Jardins d\'El Menzah 1', gov: 'Ariana', lat: 36.848, lng: 10.161 },
  { id: 'ariana-jardins-d-el-menzah-2', name: 'Jardins d\'El Menzah 2', gov: 'Ariana', lat: 36.85, lng: 10.166 },
  { id: 'ariana-kalaat-el-andalous', name: 'Kalâat el-Andalous', gov: 'Ariana', lat: 37.053, lng: 10.1 },
  { id: 'ariana-la-soukra', name: 'La Soukra', gov: 'Ariana', lat: 36.883, lng: 10.235 },
  { id: 'ariana-mnihla', name: 'Mnihla', gov: 'Ariana', lat: 36.873, lng: 10.122 },
  { id: 'ariana-nouvelle-ariana', name: 'Nouvelle Ariana', gov: 'Ariana', lat: 36.868, lng: 10.19 },
  { id: 'ariana-nouvelle-soukra', name: 'Nouvelle Soukra', gov: 'Ariana', lat: 36.878, lng: 10.24 },
  { id: 'ariana-petite-ariana', name: 'Petite Ariana', gov: 'Ariana', lat: 36.862, lng: 10.198 },
  { id: 'ariana-raoued', name: 'Raoued', gov: 'Ariana', lat: 36.976, lng: 10.2 },
  { id: 'ariana-riadh-el-andalous', name: 'Riadh El Andalous', gov: 'Ariana', lat: 36.868, lng: 10.205 },
  { id: 'ariana-sidi-fraj', name: 'Sidi Fraj', gov: 'Ariana', lat: 36.885, lng: 10.21 },
  { id: 'ariana-sidi-thabet', name: 'Sidi Thabet', gov: 'Ariana', lat: 36.916, lng: 10.045 },
  { id: 'ariana-soukra-park', name: 'Soukra Park', gov: 'Ariana', lat: 36.888, lng: 10.245 },
  // — Ben Arous —
  { id: 'benarous-ben-arous-ville', name: 'Ben Arous Ville', gov: 'Ben Arous', lat: 36.753, lng: 10.231 },
  { id: 'benarous-bennane', name: 'Bennane', gov: 'Ben Arous', lat: 36.74, lng: 10.245 },
  { id: 'benarous-bir-el-bey', name: 'Bir El Bey', gov: 'Ben Arous', lat: 36.735, lng: 10.27 },
  { id: 'benarous-bir-kassaa', name: 'Bir Kassâa', gov: 'Ben Arous', lat: 36.748, lng: 10.215 },
  { id: 'benarous-borj-cedria', name: 'Borj Cédria', gov: 'Ben Arous', lat: 36.715, lng: 10.4 },
  { id: 'benarous-bougarnine', name: 'Bougarnine', gov: 'Ben Arous', lat: 36.73, lng: 10.32 },
  { id: 'benarous-boumhel', name: 'Boumhel', gov: 'Ben Arous', lat: 36.735, lng: 10.295 },
  { id: 'benarous-chebedda', name: 'Chebedda', gov: 'Ben Arous', lat: 36.755, lng: 10.255 },
  { id: 'benarous-el-mhamdia-fouchana', name: 'El Mhamdia / Fouchana', gov: 'Ben Arous', lat: 36.7, lng: 10.17 },
  { id: 'benarous-el-mourouj', name: 'El Mourouj', gov: 'Ben Arous', lat: 36.731, lng: 10.22 },
  { id: 'benarous-el-mourouj-1', name: 'El Mourouj 1', gov: 'Ben Arous', lat: 36.728, lng: 10.215 },
  { id: 'benarous-el-mourouj-2', name: 'El Mourouj 2', gov: 'Ben Arous', lat: 36.725, lng: 10.218 },
  { id: 'benarous-el-mourouj-3', name: 'El Mourouj 3', gov: 'Ben Arous', lat: 36.722, lng: 10.222 },
  { id: 'benarous-el-mourouj-4', name: 'El Mourouj 4', gov: 'Ben Arous', lat: 36.72, lng: 10.225 },
  { id: 'benarous-el-mourouj-5', name: 'El Mourouj 5', gov: 'Ben Arous', lat: 36.718, lng: 10.228 },
  { id: 'benarous-el-mourouj-6', name: 'El Mourouj 6', gov: 'Ben Arous', lat: 36.715, lng: 10.231 },
  { id: 'benarous-el-yasminette', name: 'El Yasminette', gov: 'Ben Arous', lat: 36.71, lng: 10.233 },
  { id: 'benarous-ezzahra', name: 'Ezzahra', gov: 'Ben Arous', lat: 36.744, lng: 10.306 },
  { id: 'benarous-hammam-lif-hammam-chott', name: 'Hammam Lif / Hammam Chott', gov: 'Ben Arous', lat: 36.728, lng: 10.34 },
  { id: 'benarous-khelidia', name: 'Khelidia', gov: 'Ben Arous', lat: 36.685, lng: 10.23 },
  { id: 'benarous-megrine', name: 'Mégrine', gov: 'Ben Arous', lat: 36.772, lng: 10.238 },
  { id: 'benarous-megrine-riadh', name: 'Mégrine Riadh', gov: 'Ben Arous', lat: 36.768, lng: 10.242 },
  { id: 'benarous-megrine-sidi-rezig', name: 'Mégrine Sidi Rezig', gov: 'Ben Arous', lat: 36.765, lng: 10.234 },
  { id: 'benarous-mghira', name: 'Mghira', gov: 'Ben Arous', lat: 36.7, lng: 10.2 },
  { id: 'benarous-mornag', name: 'Mornag', gov: 'Ben Arous', lat: 36.676, lng: 10.29 },
  { id: 'benarous-naassen', name: 'Naassen', gov: 'Ben Arous', lat: 36.745, lng: 10.25 },
  { id: 'benarous-nouvelle-medina', name: 'Nouvelle Médina', gov: 'Ben Arous', lat: 36.74, lng: 10.235 },
  { id: 'benarous-rades', name: 'Radès', gov: 'Ben Arous', lat: 36.768, lng: 10.276 },
  // — Manouba —
  { id: 'manouba-bejaoua', name: 'Bejaoua', gov: 'Manouba', lat: 36.84, lng: 9.98 },
  { id: 'manouba-chaouat', name: 'Chaouat', gov: 'Manouba', lat: 36.87, lng: 10.02 },
  { id: 'manouba-douar-hicher', name: 'Douar Hicher', gov: 'Manouba', lat: 36.82, lng: 10.1 },
  { id: 'manouba-el-jedaida', name: 'El Jedaïda', gov: 'Manouba', lat: 36.848, lng: 9.913 },
  { id: 'manouba-ksar-said', name: 'Ksar Saïd', gov: 'Manouba', lat: 36.808, lng: 10.115 },
  { id: 'manouba-manouba-ville-denden', name: 'Manouba Ville / Denden', gov: 'Manouba', lat: 36.808, lng: 10.097 },
  { id: 'manouba-mornaguia-borj-el-amri', name: 'Mornaguia / Borj El Amri', gov: 'Manouba', lat: 36.755, lng: 10.014 },
  { id: 'manouba-oued-ellil', name: 'Oued Ellil', gov: 'Manouba', lat: 36.833, lng: 10.053 },
  { id: 'manouba-oued-gueriana-denden', name: 'Oued Guériana / Denden', gov: 'Manouba', lat: 36.815, lng: 10.11 },
  { id: 'manouba-sanhaja', name: 'Sanhaja', gov: 'Manouba', lat: 36.83, lng: 10.075 },
  { id: 'manouba-sidi-amor', name: 'Sidi Amor', gov: 'Manouba', lat: 36.845, lng: 10.06 },
  { id: 'manouba-tebourba', name: 'Tebourba', gov: 'Manouba', lat: 36.834, lng: 9.842 },
  // — Béja —
  { id: 'beja-beja-ville', name: 'Béja Ville', gov: 'Béja', lat: 36.725, lng: 9.185 },
  { id: 'beja-medjez-el-bab', name: 'Medjez el-Bab', gov: 'Béja', lat: 36.649, lng: 9.61 },
  { id: 'beja-nefza-amdoun', name: 'Nefza / Amdoun', gov: 'Béja', lat: 36.98, lng: 9.07 },
  { id: 'beja-teboursouk', name: 'Téboursouk', gov: 'Béja', lat: 36.458, lng: 9.245 },
  { id: 'beja-testour', name: 'Testour', gov: 'Béja', lat: 36.55, lng: 9.443 },
  { id: 'beja-thibar', name: 'Thibar', gov: 'Béja', lat: 36.52, lng: 9.08 },
  // — Bizerte —
  { id: 'bizerte-ain-mariem', name: 'Aïn Mariem', gov: 'Bizerte', lat: 37.255, lng: 9.855 },
  { id: 'bizerte-bizerte-ville', name: 'Bizerte Ville', gov: 'Bizerte', lat: 37.274, lng: 9.873 },
  { id: 'bizerte-cap-zbib', name: 'Cap Zbib', gov: 'Bizerte', lat: 37.26, lng: 10.06 },
  { id: 'bizerte-corniche-bizerte', name: 'Corniche Bizerte', gov: 'Bizerte', lat: 37.281, lng: 9.882 },
  { id: 'bizerte-el-alia', name: 'El Alia', gov: 'Bizerte', lat: 37.17, lng: 10.03 },
  { id: 'bizerte-el-bhira', name: 'El Bhira', gov: 'Bizerte', lat: 37.19, lng: 9.87 },
  { id: 'bizerte-errimel', name: 'Errimel', gov: 'Bizerte', lat: 37.23, lng: 9.87 },
  { id: 'bizerte-ghar-el-melh-utique', name: 'Ghar El Melh / Utique', gov: 'Bizerte', lat: 37.17, lng: 10.19 },
  { id: 'bizerte-jarzouna', name: 'Jarzouna', gov: 'Bizerte', lat: 37.255, lng: 9.9 },
  { id: 'bizerte-mateur', name: 'Mateur', gov: 'Bizerte', lat: 37.04, lng: 9.665 },
  { id: 'bizerte-menzel-abderrahmen', name: 'Menzel Abderrahmen', gov: 'Bizerte', lat: 37.22, lng: 9.92 },
  { id: 'bizerte-menzel-bourguiba', name: 'Menzel Bourguiba', gov: 'Bizerte', lat: 37.15, lng: 9.79 },
  { id: 'bizerte-menzel-jemil', name: 'Menzel Jemil', gov: 'Bizerte', lat: 37.235, lng: 9.915 },
  { id: 'bizerte-metline', name: 'Metline', gov: 'Bizerte', lat: 37.23, lng: 10.05 },
  { id: 'bizerte-raf-raf', name: 'Raf Raf', gov: 'Bizerte', lat: 37.2, lng: 10.18 },
  { id: 'bizerte-ras-jebel', name: 'Ras Jebel', gov: 'Bizerte', lat: 37.215, lng: 10.12 },
  { id: 'bizerte-sejnane', name: 'Sejnane', gov: 'Bizerte', lat: 37.055, lng: 9.24 },
  { id: 'bizerte-sidi-salem', name: 'Sidi Salem', gov: 'Bizerte', lat: 37.262, lng: 9.86 },
  { id: 'bizerte-sounine', name: 'Sounine', gov: 'Bizerte', lat: 37.19, lng: 10.15 },
  { id: 'bizerte-tinja', name: 'Tinja', gov: 'Bizerte', lat: 37.17, lng: 9.76 },
  { id: 'bizerte-touibia', name: 'Touibia', gov: 'Bizerte', lat: 37.1, lng: 9.7 },
  // — Gabès —
  { id: 'gabes-el-hamma', name: 'El Hamma', gov: 'Gabès', lat: 33.886, lng: 9.795 },
  { id: 'gabes-gabes-sud', name: 'Gabès Sud', gov: 'Gabès', lat: 33.86, lng: 10.1 },
  { id: 'gabes-gabes-ville', name: 'Gabès Ville', gov: 'Gabès', lat: 33.881, lng: 10.098 },
  // Ghannouch (zone industrielle, sur la côte) et Métouia (à l'intérieur des
  // terres) étaient fusionnées en une seule zone dans la liste du concurrent.
  // Séparées : rien ne garantit qu'elles soient sur le même circuit, et une
  // fusion rend cette différence structurellement invisible (§4.1).
  { id: 'gabes-ghannouch', name: 'Ghannouch', gov: 'Gabès', lat: 33.938, lng: 10.093 },
  { id: 'gabes-mareth', name: 'Mareth', gov: 'Gabès', lat: 33.63, lng: 10.28 },
  { id: 'gabes-matmata', name: 'Matmata', gov: 'Gabès', lat: 33.544, lng: 9.97 },
  { id: 'gabes-metouia', name: 'Métouia', gov: 'Gabès', lat: 33.967, lng: 10.0 },
  { id: 'gabes-oudhref', name: 'Oudhref', gov: 'Gabès', lat: 33.925, lng: 10.02 },
  { id: 'gabes-tebelbou', name: 'Tbelbou', gov: 'Gabès', lat: 33.87, lng: 9.85 },
  { id: 'gabes-zrig', name: 'Zrig', gov: 'Gabès', lat: 33.872, lng: 10.082 },
  // — Gafsa —
  { id: 'gafsa-el-guettar', name: 'El Guettar', gov: 'Gafsa', lat: 34.34, lng: 8.94 },
  { id: 'gafsa-gafsa-ville', name: 'Gafsa Ville', gov: 'Gafsa', lat: 34.425, lng: 8.784 },
  { id: 'gafsa-mdhilla', name: 'Mdhilla', gov: 'Gafsa', lat: 34.28, lng: 8.66 },
  { id: 'gafsa-metlaoui', name: 'Métlaoui', gov: 'Gafsa', lat: 34.32, lng: 8.4 },
  { id: 'gafsa-redeyef-moulares', name: 'Redeyef / Moularès', gov: 'Gafsa', lat: 34.4, lng: 8.155 },
  // — Jendouba —
  { id: 'jendouba-ain-draham', name: 'Aïn Draham', gov: 'Jendouba', lat: 36.775, lng: 8.685 },
  { id: 'jendouba-bou-salem', name: 'Bou Salem', gov: 'Jendouba', lat: 36.61, lng: 8.97 },
  { id: 'jendouba-ghardimaou', name: 'Ghardimaou', gov: 'Jendouba', lat: 36.45, lng: 8.435 },
  { id: 'jendouba-jendouba-ville', name: 'Jendouba Ville', gov: 'Jendouba', lat: 36.501, lng: 8.78 },
  { id: 'jendouba-tabarka', name: 'Tabarka', gov: 'Jendouba', lat: 36.954, lng: 8.758 },
  // — Kairouan —
  { id: 'kairouan-bou-hajla-nasrallah', name: 'Bou Hajla / Nasrallah', gov: 'Kairouan', lat: 35.4, lng: 10.1 },
  { id: 'kairouan-hajeb-el-ayoun', name: 'Hajeb El Ayoun', gov: 'Kairouan', lat: 35.383, lng: 9.545 },
  { id: 'kairouan-kairouan-ville', name: 'Kairouan Ville', gov: 'Kairouan', lat: 35.678, lng: 10.096 },
  { id: 'kairouan-oueslatia-haffouz', name: 'Oueslatia / Haffouz', gov: 'Kairouan', lat: 35.75, lng: 9.6 },
  { id: 'kairouan-sbikha', name: 'Sbikha', gov: 'Kairouan', lat: 35.93, lng: 10.01 },
  // — Kasserine —
  { id: 'kasserine-feriana', name: 'Fériana', gov: 'Kasserine', lat: 34.95, lng: 8.57 },
  { id: 'kasserine-kasserine-ville', name: 'Kasserine Ville', gov: 'Kasserine', lat: 35.167, lng: 8.836 },
  { id: 'kasserine-sbeitla', name: 'Sbeïtla', gov: 'Kasserine', lat: 35.237, lng: 9.12 },
  { id: 'kasserine-sbiba-foussana', name: 'Sbiba / Foussana', gov: 'Kasserine', lat: 35.55, lng: 9.075 },
  { id: 'kasserine-thala', name: 'Thala', gov: 'Kasserine', lat: 35.573, lng: 8.67 },
  // — Kébili —
  { id: 'kebili-douz', name: 'Douz', gov: 'Kébili', lat: 33.466, lng: 9.02 },
  { id: 'kebili-jemna', name: 'Jemna', gov: 'Kébili', lat: 33.57, lng: 9.02 },
  { id: 'kebili-kebili-ville', name: 'Kébili Ville', gov: 'Kébili', lat: 33.705, lng: 8.969 },
  { id: 'kebili-souk-lahad', name: 'Souk Lahad', gov: 'Kébili', lat: 33.78, lng: 8.9 },
  // — Le Kef —
  { id: 'kef-dahmani', name: 'Dahmani', gov: 'Le Kef', lat: 35.945, lng: 8.83 },
  { id: 'kef-jerissa', name: 'Jerissa', gov: 'Le Kef', lat: 35.865, lng: 8.64 },
  { id: 'kef-le-kef-ville', name: 'Le Kef Ville', gov: 'Le Kef', lat: 36.174, lng: 8.705 },
  { id: 'kef-le-sers', name: 'Le Sers', gov: 'Le Kef', lat: 36.07, lng: 9.02 },
  { id: 'kef-tajerouine', name: 'Tajerouine', gov: 'Le Kef', lat: 35.89, lng: 8.555 },
  // — Mahdia —
  { id: 'mahdia-chebba', name: 'Chebba', gov: 'Mahdia', lat: 35.237, lng: 11.115 },
  { id: 'mahdia-el-jem', name: 'El Jem', gov: 'Mahdia', lat: 35.296, lng: 10.712 },
  { id: 'mahdia-ksour-essef', name: 'Ksour Essef', gov: 'Mahdia', lat: 35.418, lng: 11.0 },
  { id: 'mahdia-mahdia-ville', name: 'Mahdia Ville', gov: 'Mahdia', lat: 35.504, lng: 11.062 },
  { id: 'mahdia-mellouleche', name: 'Melloulèche', gov: 'Mahdia', lat: 35.17, lng: 11.02 },
  { id: 'mahdia-rejiche', name: 'Rejiche', gov: 'Mahdia', lat: 35.47, lng: 11.055 },
  { id: 'mahdia-salakta', name: 'Salakta', gov: 'Mahdia', lat: 35.39, lng: 11.045 },
  { id: 'mahdia-sidi-alouane', name: 'Sidi Alouane', gov: 'Mahdia', lat: 35.41, lng: 10.94 },
  { id: 'mahdia-souassi-bou-merdes', name: 'Souassi / Bou Merdes', gov: 'Mahdia', lat: 35.28, lng: 10.61 },
  // — Médenine —
  { id: 'medenine-ben-guerdane', name: 'Ben Guerdane', gov: 'Médenine', lat: 33.138, lng: 11.22 },
  { id: 'medenine-beni-khedache', name: 'Béni Khedache', gov: 'Médenine', lat: 33.25, lng: 10.2 },
  { id: 'medenine-boughrara', name: 'Boughrara', gov: 'Médenine', lat: 33.53, lng: 10.68 },
  { id: 'medenine-djerba-aghir', name: 'Djerba Aghir', gov: 'Médenine', lat: 33.78, lng: 11.0 },
  { id: 'medenine-djerba-ajim', name: 'Djerba Ajim', gov: 'Médenine', lat: 33.72, lng: 10.75 },
  { id: 'medenine-djerba-el-may', name: 'Djerba El May', gov: 'Médenine', lat: 33.815, lng: 10.925 },
  { id: 'medenine-djerba-erriadh', name: 'Djerba Erriadh', gov: 'Médenine', lat: 33.81, lng: 10.9 },
  { id: 'medenine-djerba-guellala', name: 'Djerba Guellala', gov: 'Médenine', lat: 33.72, lng: 10.85 },
  { id: 'medenine-djerba-houmt-souk', name: 'Djerba Houmt Souk', gov: 'Médenine', lat: 33.875, lng: 10.857 },
  { id: 'medenine-djerba-mellita', name: 'Djerba Mellita', gov: 'Médenine', lat: 33.87, lng: 10.775 },
  { id: 'medenine-djerba-mezraya', name: 'Djerba Mezraya', gov: 'Médenine', lat: 33.79, lng: 10.88 },
  { id: 'medenine-djerba-midoun', name: 'Djerba Midoun', gov: 'Médenine', lat: 33.808, lng: 10.995 },
  { id: 'medenine-djerba-robbana', name: 'Djerba Robbana', gov: 'Médenine', lat: 33.85, lng: 11.01 },
  { id: 'medenine-djerba-sedouikech', name: 'Djerba Sedouikech', gov: 'Médenine', lat: 33.78, lng: 10.93 },
  // Zone hôtelière de la côte nord-est, entre Houmt Souk et Robbana.
  { id: 'medenine-djerba-sidi-mehrez', name: 'Djerba Sidi Mehrez (zone touristique)', gov: 'Médenine', lat: 33.865, lng: 10.955 },
  { id: 'medenine-medenine-ville', name: 'Médenine Ville', gov: 'Médenine', lat: 33.354, lng: 10.505 },
  { id: 'medenine-zarzis', name: 'Zarzis', gov: 'Médenine', lat: 33.504, lng: 11.112 },
  // — Monastir —
  { id: 'monastir-bembla', name: 'Bembla', gov: 'Monastir', lat: 35.7, lng: 10.72 },
  { id: 'monastir-beni-hassen', name: 'Béni Hassen', gov: 'Monastir', lat: 35.61, lng: 10.78 },
  { id: 'monastir-bouhjar', name: 'Bouhjar', gov: 'Monastir', lat: 35.635, lng: 10.775 },
  { id: 'monastir-jemmal-sahline', name: 'Jemmal / Sahline', gov: 'Monastir', lat: 35.63, lng: 10.76 },
  { id: 'monastir-khniss', name: 'Khniss', gov: 'Monastir', lat: 35.735, lng: 10.8 },
  { id: 'monastir-ksar-hellal', name: 'Ksar Hellal', gov: 'Monastir', lat: 35.645, lng: 10.89 },
  { id: 'monastir-ksibet-el-mediouni', name: 'Ksibet El Mediouni', gov: 'Monastir', lat: 35.685, lng: 10.85 },
  { id: 'monastir-lamta', name: 'Lamta', gov: 'Monastir', lat: 35.68, lng: 10.88 },
  { id: 'monastir-menzel-kamel', name: 'Menzel Kamel', gov: 'Monastir', lat: 35.62, lng: 10.73 },
  { id: 'monastir-moknine', name: 'Moknine', gov: 'Monastir', lat: 35.633, lng: 10.9 },
  { id: 'monastir-monastir-ville-skanes', name: 'Monastir Ville / Skanès', gov: 'Monastir', lat: 35.778, lng: 10.826 },
  { id: 'monastir-ouardanine', name: 'Ouardanine', gov: 'Monastir', lat: 35.7, lng: 10.68 },
  { id: 'monastir-sayada', name: 'Sayada', gov: 'Monastir', lat: 35.665, lng: 10.9 },
  { id: 'monastir-teboulba-bekalta', name: 'Téboulba / Bekalta', gov: 'Monastir', lat: 35.65, lng: 10.96 },
  { id: 'monastir-touza', name: 'Touza', gov: 'Monastir', lat: 35.66, lng: 10.87 },
  { id: 'monastir-zeramdine-ouerdanine', name: 'Zeramdine / Ouerdanine', gov: 'Monastir', lat: 35.59, lng: 10.72 },
  // — Nabeul —
  { id: 'nabeul-azmour', name: 'Azmour', gov: 'Nabeul', lat: 36.4, lng: 10.7 },
  { id: 'nabeul-beni-khalled', name: 'Béni Khalled', gov: 'Nabeul', lat: 36.645, lng: 10.59 },
  { id: 'nabeul-bir-bouregba', name: 'Bir Bouregba', gov: 'Nabeul', lat: 36.42, lng: 10.56 },
  { id: 'nabeul-bir-challouf', name: 'Bir Challouf', gov: 'Nabeul', lat: 36.87, lng: 11.07 },
  { id: 'nabeul-bou-argoub', name: 'Bou Argoub', gov: 'Nabeul', lat: 36.56, lng: 10.52 },
  { id: 'nabeul-cite-afh-nabeul', name: 'Cité AFH Nabeul', gov: 'Nabeul', lat: 36.455, lng: 10.735 },
  { id: 'nabeul-dar-allouch', name: 'Dar Allouch', gov: 'Nabeul', lat: 36.96, lng: 11.03 },
  { id: 'nabeul-dar-chaabane-beni-khiar', name: 'Dar Chaâbane / Béni Khiar', gov: 'Nabeul', lat: 36.47, lng: 10.76 },
  { id: 'nabeul-dar-chaabane-el-fehri', name: 'Dar Chaâbane El Fehri', gov: 'Nabeul', lat: 36.47, lng: 10.75 },
  { id: 'nabeul-el-haouaria', name: 'El Haouaria', gov: 'Nabeul', lat: 37.05, lng: 11.01 },
  { id: 'nabeul-el-mida-el-somaa', name: 'El Mida / El Somâa', gov: 'Nabeul', lat: 36.64, lng: 10.87 },
  { id: 'nabeul-grombalia-bou-argoub', name: 'Grombalia / Bou Argoub', gov: 'Nabeul', lat: 36.6, lng: 10.5 },
  { id: 'nabeul-hammam-ghezaz', name: 'Hammam Ghezaz', gov: 'Nabeul', lat: 36.98, lng: 10.96 },
  { id: 'nabeul-hammamet-yasmine', name: 'Hammamet / Yasmine', gov: 'Nabeul', lat: 36.38, lng: 10.54 },
  { id: 'nabeul-hammamet-nord', name: 'Hammamet Nord', gov: 'Nabeul', lat: 36.41, lng: 10.61 },
  { id: 'nabeul-kelibia', name: 'Kélibia', gov: 'Nabeul', lat: 36.847, lng: 11.094 },
  { id: 'nabeul-kerkes', name: 'Kerker', gov: 'Nabeul', lat: 36.9, lng: 10.95 },
  { id: 'nabeul-kerkouane', name: 'Kerkouane', gov: 'Nabeul', lat: 36.947, lng: 11.1 },
  { id: 'nabeul-korba', name: 'Korba', gov: 'Nabeul', lat: 36.573, lng: 10.857 },
  { id: 'nabeul-maamoura', name: 'Maâmoura', gov: 'Nabeul', lat: 36.52, lng: 10.8 },
  { id: 'nabeul-menzel-horr', name: 'Menzel Horr', gov: 'Nabeul', lat: 36.7, lng: 10.7 },
  { id: 'nabeul-menzel-temime', name: 'Menzel Temime', gov: 'Nabeul', lat: 36.78, lng: 10.986 },
  { id: 'nabeul-mrezga', name: 'Mrezga', gov: 'Nabeul', lat: 36.43, lng: 10.68 },
  { id: 'nabeul-nabeul-ville', name: 'Nabeul Ville', gov: 'Nabeul', lat: 36.451, lng: 10.735 },
  { id: 'nabeul-oued-souhil', name: 'Oued Souhil', gov: 'Nabeul', lat: 36.44, lng: 10.7 },
  { id: 'nabeul-sidi-daoud', name: 'Sidi Daoud', gov: 'Nabeul', lat: 37.01, lng: 10.91 },
  { id: 'nabeul-soliman-menzel-bouzelfa', name: 'Soliman / Menzel Bouzelfa', gov: 'Nabeul', lat: 36.7, lng: 10.49 },
  { id: 'nabeul-soliman-erriadh', name: 'Soliman Erriadh', gov: 'Nabeul', lat: 36.69, lng: 10.5 },
  { id: 'nabeul-takelsa', name: 'Takelsa', gov: 'Nabeul', lat: 36.79, lng: 10.64 },
  { id: 'nabeul-tazarka', name: 'Tazarka', gov: 'Nabeul', lat: 36.6, lng: 10.85 },
  { id: 'nabeul-zaouiet-djedidi', name: 'Zaouiet Djedidi', gov: 'Nabeul', lat: 36.63, lng: 10.47 },
  // — Sfax —
  { id: 'sfax-agareb', name: 'Agareb', gov: 'Sfax', lat: 34.745, lng: 10.53 },
  { id: 'sfax-bir-ali-ben-khalifa', name: 'Bir Ali Ben Khalifa', gov: 'Sfax', lat: 34.735, lng: 10.1 },
  { id: 'sfax-bouzayene', name: 'Bouzayène', gov: 'Sfax', lat: 34.76, lng: 10.7 },
  { id: 'sfax-chaffar', name: 'Chaffar', gov: 'Sfax', lat: 34.61, lng: 10.56 },
  { id: 'sfax-chihia', name: 'Chihia', gov: 'Sfax', lat: 34.76, lng: 10.78 },
  { id: 'sfax-cite-chaker', name: 'Cité Chaker', gov: 'Sfax', lat: 34.76, lng: 10.74 },
  { id: 'sfax-cite-el-bahri', name: 'Cité El Bahri', gov: 'Sfax', lat: 34.72, lng: 10.77 },
  { id: 'sfax-cite-el-habib', name: 'Cité El Habib', gov: 'Sfax', lat: 34.755, lng: 10.755 },
  { id: 'sfax-cite-el-ons', name: 'Cité El Ons', gov: 'Sfax', lat: 34.765, lng: 10.75 },
  { id: 'sfax-cite-el-wafa', name: 'Cité El Wafa', gov: 'Sfax', lat: 34.77, lng: 10.745 },
  { id: 'sfax-cite-jardin-sfax', name: 'Cité Jardin (Sfax)', gov: 'Sfax', lat: 34.745, lng: 10.765 },
  { id: 'sfax-el-amra', name: 'El Amra', gov: 'Sfax', lat: 35.03, lng: 10.59 },
  { id: 'sfax-el-ghraiba', name: 'El Ghraiba', gov: 'Sfax', lat: 34.56, lng: 10.32 },
  { id: 'sfax-jebeniana-el-hencha', name: 'Jebeniana / El Hencha', gov: 'Sfax', lat: 35.03, lng: 10.9 },
  { id: 'sfax-kerkennah', name: 'Kerkennah', gov: 'Sfax', lat: 34.7, lng: 11.18 },
  { id: 'sfax-mahres', name: 'Mahres', gov: 'Sfax', lat: 34.53, lng: 10.5 },
  { id: 'sfax-route-de-gremda', name: 'Route de Gremda', gov: 'Sfax', lat: 34.78, lng: 10.72 },
  { id: 'sfax-route-de-l-aeroport', name: 'Route de l\'Aéroport', gov: 'Sfax', lat: 34.72, lng: 10.7 },
  { id: 'sfax-route-de-mahdia', name: 'Route de Mahdia', gov: 'Sfax', lat: 34.76, lng: 10.79 },
  { id: 'sfax-route-de-saltnia', name: 'Route de Saltnia', gov: 'Sfax', lat: 34.77, lng: 10.73 },
  { id: 'sfax-route-de-sidi-mansour', name: 'Route de Sidi Mansour', gov: 'Sfax', lat: 34.78, lng: 10.78 },
  { id: 'sfax-route-de-sokra', name: 'Route de Sokra', gov: 'Sfax', lat: 34.79, lng: 10.74 },
  { id: 'sfax-route-de-teniour', name: 'Route de Teniour', gov: 'Sfax', lat: 34.79, lng: 10.72 },
  { id: 'sfax-route-de-tunis', name: 'Route de Tunis', gov: 'Sfax', lat: 34.775, lng: 10.76 },
  { id: 'sfax-route-el-ain', name: 'Route El Aïn', gov: 'Sfax', lat: 34.76, lng: 10.71 },
  { id: 'sfax-route-kaid-mohamed', name: 'Route Kaïd Mohamed', gov: 'Sfax', lat: 34.75, lng: 10.75 },
  { id: 'sfax-route-lafrane', name: 'Route Lafrane', gov: 'Sfax', lat: 34.775, lng: 10.73 },
  { id: 'sfax-route-menzel-chaker', name: 'Route Menzel Chaker', gov: 'Sfax', lat: 34.755, lng: 10.72 },
  { id: 'sfax-route-mharza', name: 'Route Mharza', gov: 'Sfax', lat: 34.73, lng: 10.75 },
  { id: 'sfax-route-tbolbi', name: 'Route Tbolbi', gov: 'Sfax', lat: 34.74, lng: 10.74 },
  { id: 'sfax-sakiet-eddaier', name: 'Sakiet Eddaïer', gov: 'Sfax', lat: 34.8, lng: 10.78 },
  { id: 'sfax-sakiet-ezzit', name: 'Sakiet Ezzit', gov: 'Sfax', lat: 34.81, lng: 10.76 },
  { id: 'sfax-sfax-ville', name: 'Sfax Ville', gov: 'Sfax', lat: 34.74, lng: 10.76 },
  { id: 'sfax-sidi-salah', name: 'Sidi Salah', gov: 'Sfax', lat: 34.66, lng: 10.63 },
  { id: 'sfax-skhira', name: 'Skhira', gov: 'Sfax', lat: 34.3, lng: 10.07 },
  { id: 'sfax-thyna-route-gabes', name: 'Thyna / Route Gabès', gov: 'Sfax', lat: 34.69, lng: 10.72 },
  // — Sidi Bouzid —
  { id: 'sidibouzid-jilma', name: 'Jilma', gov: 'Sidi Bouzid', lat: 35.26, lng: 9.4 },
  { id: 'sidibouzid-meknassy-mezzouna', name: 'Meknassy / Mezzouna', gov: 'Sidi Bouzid', lat: 34.64, lng: 9.61 },
  { id: 'sidibouzid-ouled-haffouz', name: 'Ouled Haffouz', gov: 'Sidi Bouzid', lat: 35.17, lng: 9.51 },
  { id: 'sidibouzid-regueb', name: 'Regueb', gov: 'Sidi Bouzid', lat: 34.86, lng: 9.785 },
  { id: 'sidibouzid-sidi-ali-ben-aoun', name: 'Sidi Ali Ben Aoun', gov: 'Sidi Bouzid', lat: 34.72, lng: 9.4 },
  { id: 'sidibouzid-sidi-bouzid-ville', name: 'Sidi Bouzid Ville', gov: 'Sidi Bouzid', lat: 35.038, lng: 9.484 },
  { id: 'sidibouzid-souk-jedid', name: 'Souk Jedid', gov: 'Sidi Bouzid', lat: 34.96, lng: 9.66 },
  // — Siliana —
  { id: 'siliana-bou-arada-gaafour', name: 'Bou Arada / Gaâfour', gov: 'Siliana', lat: 36.35, lng: 9.63 },
  { id: 'siliana-el-krib', name: 'El Krib', gov: 'Siliana', lat: 36.32, lng: 9.13 },
  { id: 'siliana-gaafour', name: 'Gaâfour', gov: 'Siliana', lat: 36.325, lng: 9.32 },
  { id: 'siliana-makthar', name: 'Makthar', gov: 'Siliana', lat: 35.855, lng: 9.205 },
  { id: 'siliana-rouhia', name: 'Rouhia', gov: 'Siliana', lat: 35.7, lng: 9.01 },
  { id: 'siliana-siliana-ville', name: 'Siliana Ville', gov: 'Siliana', lat: 36.085, lng: 9.375 },
  // — Sousse —
  { id: 'sousse-akouda', name: 'Akouda', gov: 'Sousse', lat: 35.87, lng: 10.57 },
  { id: 'sousse-bouficha', name: 'Bouficha', gov: 'Sousse', lat: 36.29, lng: 10.45 },
  { id: 'sousse-bouhsina', name: 'Bouhsina', gov: 'Sousse', lat: 35.84, lng: 10.61 },
  { id: 'sousse-chott-meriem', name: 'Chott Meriem', gov: 'Sousse', lat: 35.91, lng: 10.57 },
  { id: 'sousse-cite-erriadh', name: 'Cité Erriadh', gov: 'Sousse', lat: 35.81, lng: 10.612 },
  { id: 'sousse-enfidha-hergla', name: 'Enfidha / Hergla', gov: 'Sousse', lat: 36.135, lng: 10.38 },
  { id: 'sousse-hammam-sousse', name: 'Hammam Sousse', gov: 'Sousse', lat: 35.86, lng: 10.595 },
  { id: 'sousse-jawhara', name: 'Jawhara', gov: 'Sousse', lat: 35.845, lng: 10.605 },
  { id: 'sousse-kalaa-kebira', name: 'Kalâa Kebira', gov: 'Sousse', lat: 35.87, lng: 10.535 },
  { id: 'sousse-kalaa-seghira', name: 'Kalâa Seghira', gov: 'Sousse', lat: 35.835, lng: 10.55 },
  { id: 'sousse-khezama', name: 'Khézama', gov: 'Sousse', lat: 35.85, lng: 10.61 },
  { id: 'sousse-khezama-ouest', name: 'Khézama Ouest', gov: 'Sousse', lat: 35.845, lng: 10.6 },
  { id: 'sousse-ksibet-thrayet', name: 'Ksibet Thrayet', gov: 'Sousse', lat: 35.82, lng: 10.58 },
  { id: 'sousse-messadine', name: 'Messadine', gov: 'Sousse', lat: 35.8, lng: 10.59 },
  { id: 'sousse-msaken', name: 'Msaken', gov: 'Sousse', lat: 35.73, lng: 10.58 },
  { id: 'sousse-port-el-kantaoui', name: 'Port El Kantaoui', gov: 'Sousse', lat: 35.89, lng: 10.595 },
  { id: 'sousse-sahloul', name: 'Sahloul', gov: 'Sousse', lat: 35.835, lng: 10.6 },
  { id: 'sousse-sahloul-3', name: 'Sahloul 3', gov: 'Sousse', lat: 35.833, lng: 10.596 },
  { id: 'sousse-sahloul-4', name: 'Sahloul 4', gov: 'Sousse', lat: 35.83, lng: 10.598 },
  { id: 'sousse-sidi-abdelhamid', name: 'Sidi Abdelhamid', gov: 'Sousse', lat: 35.795, lng: 10.615 },
  { id: 'sousse-sidi-bou-ali-kondar', name: 'Sidi Bou Ali / Kondar', gov: 'Sousse', lat: 35.95, lng: 10.47 },
  { id: 'sousse-sousse-ville', name: 'Sousse Ville', gov: 'Sousse', lat: 35.825, lng: 10.636 },
  { id: 'sousse-zaouiet-sousse', name: 'Zaouiet Sousse', gov: 'Sousse', lat: 35.79, lng: 10.62 },
  // — Tataouine —
  { id: 'tataouine-bir-lahmar', name: 'Bir Lahmar', gov: 'Tataouine', lat: 33.05, lng: 10.55 },
  { id: 'tataouine-ghomrassen', name: 'Ghomrassen', gov: 'Tataouine', lat: 33.06, lng: 10.35 },
  { id: 'tataouine-remada', name: 'Remada', gov: 'Tataouine', lat: 32.315, lng: 10.4 },
  { id: 'tataouine-tataouine-ville', name: 'Tataouine Ville', gov: 'Tataouine', lat: 32.929, lng: 10.451 },
  // — Tozeur —
  { id: 'tozeur-degache', name: 'Degache', gov: 'Tozeur', lat: 33.98, lng: 8.21 },
  { id: 'tozeur-el-hamma-du-jerid', name: 'El Hamma du Jérid', gov: 'Tozeur', lat: 33.87, lng: 8.13 },
  { id: 'tozeur-nefta', name: 'Nefta', gov: 'Tozeur', lat: 33.873, lng: 7.878 },
  { id: 'tozeur-tozeur-ville', name: 'Tozeur Ville', gov: 'Tozeur', lat: 33.92, lng: 8.133 },
  // — Zaghouan —
  { id: 'zaghouan-bir-mchergua', name: 'Bir Mchergua', gov: 'Zaghouan', lat: 36.48, lng: 10.17 },
  { id: 'zaghouan-el-fahs', name: 'El Fahs', gov: 'Zaghouan', lat: 36.377, lng: 9.905 },
  { id: 'zaghouan-nadhour-saouaf', name: 'Nadhour / Saouaf', gov: 'Zaghouan', lat: 36.23, lng: 10.06 },
  { id: 'zaghouan-zaghouan-ville', name: 'Zaghouan Ville', gov: 'Zaghouan', lat: 36.402, lng: 10.142 },
  { id: 'zaghouan-zriba-hammam-zriba', name: 'Zriba / Hammam Zriba', gov: 'Zaghouan', lat: 36.36, lng: 10.2 },
]

export const ZONES_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

// Equirectangular approximation — cheap, fine at country scale. Comparable metric.
function roughDist2(aLat, aLng, bLat, bLng) {
  const meanLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const dx = (aLng - bLng) * Math.cos(meanLat);
  const dy = aLat - bLat;
  return dx * dx + dy * dy;
}

export function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Nationwide coverage: if the nearest zone is further than this, treat as
// outside coverage (e.g. user abroad or bad fix).
export const COVERAGE_MAX_KM = 60;

export function zoneForPoint(lat, lng) {
  let best = null;
  let bestD2 = Infinity;
  for (const z of ZONES) {
    const d2 = roughDist2(lat, lng, z.lat, z.lng);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = z;
    }
  }
  if (!best) return null;
  if (distanceKm(lat, lng, best.lat, best.lng) > COVERAGE_MAX_KM) return null;
  return best;
}

// Nos centroïdes sont APPROXIMATIFS (voir l'en-tête). Une erreur de placement de
// 2–3 km suffit à faire passer la frontière de Voronoï en plein milieu d'une
// ville : quelqu'un à Oudhref se retrouve assigné à Métouia sans que son GPS ait
// le moindre défaut. Le rayon d'acceptation doit donc tolérer NOTRE imprécision,
// pas seulement celle du GPS.
// La tolérance sur NOS centroïdes s'adapte à la densité locale, mesurée par la
// distance à la zone la plus proche. Une tolérance fixe était mauvaise des deux
// côtés : trop serrée en zone rurale (Oudhref sortait de la liste alors que
// l'utilisateur y était), trop large dans Tunis dense où elle ouvrait le vote
// sur une vingtaine de quartiers. Un repère de quartier tunisois est fiable à
// quelques centaines de mètres ; un repère de village l'est à quelques km.
const TOLERANCE_FACTOR = 1.2;
const TOLERANCE_MIN_KM = 0.4;
const TOLERANCE_MAX_KM = 3.5;
// Plafond dur : au-delà, « tolérer notre imprécision » deviendrait « voter où on
// veut ». C'est lui qui garde le verrou du §8 utile.
const MAX_ACCEPTABLE = 16;
// On propose TOUJOURS au moins ce nombre de zones proches. Sans ce plancher, un
// point imprécis qui dérive de quelques kilomètres n'offrait qu'un seul choix —
// et forcément le mauvais, puisque c'est justement la dérive qui l'avait élu.
const MIN_CANDIDATES = 3;
// Au-delà, on n'est plus dans « lever une ambiguïté » mais dans « choisir au
// hasard sur la carte ».
const HARD_CAP_KM = 25;

/** Les `n` zones dont le centre est le plus proche du point, les plus proches d'abord. */
export function nearestZones(lat, lng, n = 1) {
  const scored = [];
  for (const z of ZONES) {
    const d = distanceKm(lat, lng, z.lat, z.lng);
    if (d <= COVERAGE_MAX_KM) scored.push({ zone: z, d });
  }
  scored.sort((a, b) => a.d - b.d);
  return scored.slice(0, n).map((s) => s.zone);
}

/**
 * Les zones qu'un appareil situé ici a le droit de faire bouger — et donc aussi
 * celles qu'on propose quand il faut trancher à la main.
 *
 * Calculé à l'IDENTIQUE côté client et côté serveur : le serveur re-dérive
 * toujours cette liste depuis le GPS reçu et n'accepte un `zone_id` que s'il en
 * fait partie (§8). On ne peut donc jamais signaler dans un quartier où l'on
 * n'est pas, seulement lever une ambiguïté autour de sa propre position.
 */
export function acceptableZones(lat, lng, accuracyMeters) {
  const scored = [];
  for (const z of ZONES) {
    const d = distanceKm(lat, lng, z.lat, z.lng);
    if (d <= COVERAGE_MAX_KM) scored.push({ zone: z, d });
  }
  if (scored.length === 0) return [];
  scored.sort((a, b) => a.d - b.d);

  const acc = Number(accuracyMeters);
  const accKm = Number.isFinite(acc) && acc > 0 ? acc / 1000 : 0;

  // Budget d'incertitude, cumulé — les erreurs s'additionnent, elles ne se
  // remplacent pas :
  //   scored[0].d  la zone la plus proche peut déjà être loin (zones rurales),
  //   accKm        la vraie position peut être à `accuracy` du point mesuré,
  //   tolerance    et notre centroïde lui-même est approximatif.
  const tolerance = Math.min(
    TOLERANCE_MAX_KM,
    Math.max(TOLERANCE_MIN_KM, scored[0].d * TOLERANCE_FACTOR)
  );
  const radius = scored[0].d + accKm + tolerance;

  const within = scored.filter((s) => s.d <= radius);

  // Plancher : même si le rayon ne couvre qu'une zone, on en propose plusieurs.
  // Un choix unique n'est pas un choix, et c'est précisément dans ce cas que la
  // zone élue est la moins fiable.
  const list = within.length >= MIN_CANDIDATES
    ? within
    : scored.filter((s) => s.d <= HARD_CAP_KM).slice(0, MIN_CANDIDATES);

  return list.slice(0, MAX_ACCEPTABLE).map((s) => s.zone);
}

/** Deux zones quasi équidistantes = le plus proche centroïde ne prouve rien. */
export function isAmbiguous(lat, lng) {
  const [a, b] = nearestZones(lat, lng, 2);
  if (!a || !b) return false;
  const da = distanceKm(lat, lng, a.lat, a.lng);
  const db = distanceKm(lat, lng, b.lat, b.lng);
  // Écart de moins de 40 % : vu l'imprécision de nos centroïdes, départager
  // serait un coup de dés. Mieux vaut demander.
  return db < da * 1.4;
}
