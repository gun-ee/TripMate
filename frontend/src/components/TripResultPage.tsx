import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axios';
import Header from './Header';
import PDFExport from './PDFExport';
import './TripPlan.css';
import './TripEdit.css';
import { MapContainer, TileLayer, Marker, Polyline, GeoJSON } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

type Day = {
  id: number; dayIndex: number; date: string; startTime: string; endTime: string;
  items: Array<{ id: number; sortOrder: number; nameSnapshot: string; stayMin?: number; lat: number; lng: number; }>
  legs?: Array<{ id: number; fromItemId: number; toItemId: number; distanceM?: number; durationSec?: number; routePolyline?: string | null }>;
};
type TripResultView = {
  id: number; title: string; city: string; startDate: string; endDate: string;
  defaultStartTime: string; defaultEndTime: string; days: Day[];
};

export default function TripResultPage() {
  const [trip, setTrip] = useState<TripResultView | null>(null);
  const [active, setActive] = useState(0);
  const [localDays, setLocalDays] = useState<Day[]>([]);

  const timetable = useMemo(() => {
    const d = localDays[active];
    if (!d) return [] as Array<{arrive: string; depart: string; travelMin: number}>;
    const start = (d.startTime as unknown as string)?.slice(0,5) || '09:00';
    const end = (d.endTime as unknown as string)?.slice(0,5) || '18:00';
    const toMinutes = (s: string) => { const [h,m]=s.split(':').map(x=>parseInt(x,10)); return h*60+(m||0); };
    const toHHMM = (m: number) => { const h=Math.floor(m/60), mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; };
    const legs = d.legs ?? [];
    const legMap = new Map<string, number>();
    legs.forEach(l => { if (l.fromItemId && l.toItemId) legMap.set(`${l.fromItemId}->${l.toItemId}`, Math.max(0, Math.round((l.durationSec||0)/60))); });
    let t = toMinutes(start);
    const endMin = toMinutes(end);
    const out: Array<{arrive: string; depart: string; travelMin: number}> = [];
    d.items.forEach((it, idx) => {
      let travel = 0;
      if (idx>0) {
        const prev = d.items[idx-1];
        travel = legMap.get(`${prev.id}->${it.id}`) ?? 0;
        t += travel;
      }
      const arrive = t;
      const stay = Math.max(0, it.stayMin ?? 60);
      let depart = arrive + stay;
      if (depart > endMin) depart = endMin;
      out.push({ arrive: toHHMM(arrive), depart: toHHMM(depart), travelMin: travel });
      t = depart;
    });
    return out;
  }, [localDays, active]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (!id) return;
    (async () => {
      const { data } = await axios.get<TripResultView>(`/trips/${id}/edit-view`);
      setTrip(data);
      setLocalDays(data.days);
    })();
  }, []);

  const center: LatLngExpression = useMemo(() => {
    const d = localDays[active];
    if (!d || !d.items?.length) return [33.4996, 126.5312];
    return [d.items[0].lat, d.items[0].lng] as LatLngExpression;
  }, [localDays, active]);

  // PDF 출력을 위한 데이터 변환 함수
  const convertToPDFFormat = () => {
    if (!trip) return { days: [], cityQuery: '', startDate: '', endDate: '', dayStart: '09:00', dayEnd: '18:00' };
    
    const convertedDays = trip.days.map(day => {
      // 실제 시간표 계산 (TripResultPage의 timetable 로직과 동일)
      const start = day.startTime?.slice(0,5) || '09:00';
      const end = day.endTime?.slice(0,5) || '18:00';
      const toMinutes = (s: string) => { const [h,m]=s.split(':').map(x=>parseInt(x,10)); return h*60+(m||0); };
      const toHHMM = (m: number) => { const h=Math.floor(m/60), mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; };
      
      const legs = day.legs ?? [];
      const legMap = new Map<string, number>();
      legs.forEach(l => { 
        if (l.fromItemId && l.toItemId) 
          legMap.set(`${l.fromItemId}->${l.toItemId}`, Math.max(0, Math.round((l.durationSec||0)/60))); 
      });
      
      let t = toMinutes(start);
      const endMin = toMinutes(end);
      
      return day.items.map((item, idx) => {
        let travel = 0;
        if (idx > 0) {
          const prev = day.items[idx-1];
          travel = legMap.get(`${prev.id}->${item.id}`) ?? 0;
          t += travel;
        }
        const arrive = t;
        const stay = Math.max(0, item.stayMin ?? 60);
        let depart = arrive + stay;
        if (depart > endMin) depart = endMin;
        t = depart;
        
        return {
          id: String(item.id),
          name: item.nameSnapshot,
          lat: item.lat,
          lon: item.lng,
          durationMin: stay,
          arrive: toHHMM(arrive),
          depart: toHHMM(depart),
          travelMin: travel,
          isLodging: false // TripResultPage에서는 숙소 정보가 없으므로 false로 설정
        };
      });
    });
    
    return {
      days: convertedDays,
      cityQuery: trip.city,
      startDate: trip.startDate,
      endDate: trip.endDate,
      dayStart: trip.defaultStartTime,
      dayEnd: trip.defaultEndTime
    };
  };

  const handleEditTrip = () => {
    // 여행계획 페이지로 이동 (기존 데이터와 함께)
    window.location.href = `/plan?editId=${trip?.id}`;
  };

  if (!trip) return <div className="plan-page"><Header /><div style={{padding:20}}>불러오는 중…</div></div>;

  return (
    <div className="plan-page">
      <Header />
      <div className="plan-row" style={{ gridTemplateColumns: '0.3fr 1fr 1fr' }}>
        {/* 상단 설정 바: 편집 버튼 및 PDF 출력 */}
        <div className="topbar" style={{gridColumn: '1 / span 3'}}>
          <div className="grow" />
          <PDFExport {...convertToPDFFormat()} />
          <button 
            className="btn primary"
            onClick={handleEditTrip}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ✏️ 여행 계획 편집
          </button>
        </div>
        
        {/* 좌측 일차 네비게이션 */}
        <div className="results-wrap" style={{minWidth:160}}>
          <div className="results-header">전체일정</div>
          <div className="results-list">
            {trip.days.map((d, i) => (
              <button key={d.id} className="chip" onClick={() => setActive(i)}>{d.dayIndex}일차</button>
            ))}
          </div>
        </div>

        {/* 가운데: 일정 리스트 */}
        <div className="results-wrap">
          <div className="results-header">일정 (Day {trip.days[active]?.dayIndex})</div>
          <div className="results-list">
            <div className="day-header">
              <div className="day-title">{trip.days[active]?.dayIndex}일차</div>
              <div className="day-date">{trip.days[active]?.date}</div>
              <div className="day-range">
                {(localDays[active]?.startTime as unknown as string)?.slice(0,5) || '09:00'} ~ {(localDays[active]?.endTime as unknown as string)?.slice(0,5) || '18:00'}
              </div>
            </div>
            <div className="timeline">
            {(localDays[active]?.items ?? []).map((it, i) => (
              <div key={it.id} className="tl-item">
                <div className="tl-time">
                  <div className="arrive">{timetable[i]?.arrive ?? '--:--'}</div>
                  <div className="depart">{timetable[i]?.depart ?? '--:--'}</div>
                </div>
                <div className="tl-axis">
                  <div className="tl-dot">{i+1}</div>
                  {i < (localDays[active]?.items.length ?? 1) - 1 && (
                    <div className="tl-line" />
                  )}
                </div>
                <div className="tl-card">
                  <div className="place-title">{it.nameSnapshot}</div>
                  {i>0 && <div className="meta">🚗 이동 {timetable[i]?.travelMin ?? 0}분</div>}
                  <div className="meta">체류 {(it.stayMin ?? 60)}분</div>
                  <div className="timebar">도착 {timetable[i]?.arrive ?? '--:--'} • 출발 {timetable[i]?.depart ?? '--:--'}</div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* 우측: 지도 */}
        <div className="results-wrap">
          <div style={{width:'100%', height:'100%'}}>
            <MapContainer center={center} zoom={11} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {(localDays[active]?.items ?? []).map((s) => (
                <Marker key={s.id} position={[s.lat, s.lng] as LatLngExpression} />
              ))}
              {/* 폴리라인: OSRM geometry 있으면 GeoJSON, 없으면 직선 */}
              {trip.days[active]?.legs && trip.days[active].legs!.length > 0
                ? trip.days[active].legs!.map((lg) => {
                    if (lg.routePolyline) {
                      try {
                        const obj = JSON.parse(lg.routePolyline);
                        return <GeoJSON key={lg.id} data={obj as any} />;
                      } catch { return null; }
                    }
                    return null;
                  })
                : (localDays[active]?.items?.length ?? 0) >= 2 && (
                    <Polyline positions={(localDays[active].items).map(s => [s.lat, s.lng] as [number, number])} />
                  )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}