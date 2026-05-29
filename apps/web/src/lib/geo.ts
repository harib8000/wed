/**
 * Shared geolocation utilities for the web app.
 */

/** Haversine distance between two lat/lng points in kilometres. */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** Format a distance in km for display. Returns null for invalid values. */
export function formatDistance(distanceKm?: number | null): string | null {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) return null;
  return `${distanceKm.toFixed(1)} km away`;
}
