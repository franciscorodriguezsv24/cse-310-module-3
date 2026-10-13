import type { Branch } from '@/types/catalog';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
/** Converts degrees to radians for the trigonometry below. */
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometers (haversine formula). */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Returns the branch with the smallest straight-line distance from `from`. */
export function nearestBranch(from: Coordinates, branches: Branch[]): Branch | undefined {
  let best: Branch | undefined;
  let bestDistance = Infinity;
  for (const branch of branches) {
    const d = distanceKm(from, branch);
    if (d < bestDistance) {
      best = branch;
      bestDistance = d;
    }
  }
  return best;
}

/** Shows meters under 1 km, otherwise kilometers with one decimal. */
export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
