import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function MapAutoResize() {
  const map = useMap();
  const prev = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => {
    // 초기 1회
    setTimeout(() => map.invalidateSize({}), 0);

    const container = map.getContainer();
    const parent = container.parentElement || container;

    // 부모 크기가 의미 있게 바뀔 때만 invalidateSize
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const now = { w: Math.round(rect.width), h: Math.round(rect.height) };
      const p = prev.current;
      prev.current = now;
      if (!p) { map.invalidateSize({}); return; }

      const dW = Math.abs(now.w - p.w);
      const dH = Math.abs(now.h - p.h);
      // 6px 이하의 미세 변화는 무시 (스크롤바/폰트 리플로우 방지)
      if (dW < 6 && dH < 6) return;

      // invalidateSize가 moveend를 거의 발생시키지 않도록 애니메이션/팬 없음
      map.invalidateSize({});
    });
    ro.observe(parent);

    const onWin = () => map.invalidateSize({});
    window.addEventListener('resize', onWin);
    window.addEventListener('orientationchange', onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
      window.removeEventListener('orientationchange', onWin);
    };
  }, [map]);

  return null;
}
