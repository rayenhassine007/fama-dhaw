// GPS → zone assignment. Logic lives in shared/ so the server computes the
// identical zone from the same GPS (the client never gets to choose its zone;
// the server re-derives it on every vote — spec §8).
export {
  zoneForPoint,
  zonesNear,
  candidateRadiusKm,
  distanceKm,
  COVERAGE_MAX_KM,
} from '../../shared/zones.js';
