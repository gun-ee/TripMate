import { useEffect, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';

type Props = {
  onMoveEnd: (lat: number, lon: number) => void;
  debounceMs?: number;     // 기본 350ms
  minDeltaMeters?: number; // 이 거리 이상 이동시에만 호출 (기본 25m)
  cooldownMs?: number;     // 마지막 호출 후 쿨다운 (기본 800ms)
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // m
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MapMoveWatcher({
  onMoveEnd,
  debounceMs = 350,
  minDeltaMeters = 25,
  cooldownMs = 800,
}: Props) {
  const timer = useRef<number | null>(null);
  const lastCall = useRef<number>(0);
  const lastLat = useRef<number | null>(null);
  const lastLon = useRef<number | null>(null);

  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const now = Date.now();
        if (now - lastCall.current < cooldownMs) return;

        const prevLat = lastLat.current;
        const prevLon = lastLon.current;

        // 첫 호출은 무조건 허용
        if (prevLat != null && prevLon != null) {
          const dist = haversine(prevLat, prevLon, c.lat, c.lng);
          if (dist < minDeltaMeters) return; // 거의 안 움직였으면 무시
        }

        lastLat.current = c.lat;
        lastLon.current = c.lng;
        lastCall.current = now;
        onMoveEnd(c.lat, c.lng);
      }, debounceMs) as unknown as number;
    },
  });

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  return null;
}
