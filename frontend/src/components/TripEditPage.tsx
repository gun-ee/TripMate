import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axios';
import Header from './Header';
import './TripPlan.css';
import { MapContainer, TileLayer, Marker, Polyline, GeoJSON } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

type Day = {
  id: number; dayIndex: number; date: string; startTime: string; endTime: string;
  items: Array<{ id: number; sortOrder: number; nameSnapshot: string; stayMin?: number; lat: number; lng: number; }>
  legs?: Array<{ id: number; distanceM?: number; durationSec?: number; routePolyline?: string | null }>;
};
type TripEditView = {
  id: number; title: string; city: string; startDate: string; endDate: string;
  defaultStartTime: string; defaultEndTime: string; days: Day[];
};

export default function TripEditPage() {
  const [trip, setTrip] = useState<TripEditView | null>(null);
  const [active, setActive] = useState(0);
  const [localDays, setLocalDays] = useState<Day[]>([]);
  const [history, setHistory] = useState<Day[][]>([]);
  const [future, setFuture] = useState<Day[][]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) return;
    (async () => {
      const { data } = await axios.get<TripEditView>(`/trips/${id}/edit-view`);
      setTrip(data);
      setLocalDays(data.days);
    })();
  }, []);

  const center: LatLngExpression = useMemo(() => {
    const d = localDays[active];
    if (!d || !d.items?.length) return [33.4996, 126.5312];
    return [d.items[0].lat, d.items[0].lng] as LatLngExpression;
  }, [localDays, active]);

  if (!trip) return <div className="plan-page"><Header /><div style={{padding:20}}>불러오는 중…</div></div>;

  return (
    <div className="plan-page">
      <Header />
      <div className="plan-row" style={{ gridTemplateColumns: '0.3fr 1fr 1fr' }}>
        {/* 상단 설정 바: 타임존 */}
        <div className="topbar" style={{gridColumn: '1 / span 3'}}>
          <div className="grow" />
          <label>타임존</label>
          <select className="btn" defaultValue={trip.timeZone || 'Asia/Seoul'} onChange={async (e) => {
            const id = new URLSearchParams(location.search).get('id');
            if (!id) return;
            await axios.put(`/trips/${trip.id}/timezone`, null, { params: { tz: e.target.value } });
            alert('타임존 저장');
          }}>
            <option value="Asia/Seoul">Asia/Seoul</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
          </select>
        </div>
        {/* 좌측 일차 네비게이션 (형식만) */}
        <div className="results-wrap" style={{minWidth:160}}>
          <div className="results-header">전체일정</div>
          <div className="results-list">
            <div className="place-actions" style={{gap:8, marginBottom:8}}>
              <button className="chip" onClick={() => {
                if (history.length === 0) return;
                const prev = history[history.length - 1];
                setHistory(h => h.slice(0, -1));
                setFuture(f => [...f, localDays]);
                setLocalDays(prev);
              }}>Undo</button>
              <button className="chip" onClick={() => {
                if (future.length === 0) return;
                const next = future[future.length - 1];
                setFuture(f => f.slice(0, -1));
                setHistory(h => [...h, localDays]);
                setLocalDays(next);
              }}>Redo</button>
            </div>
            {trip.days.map((d, i) => (
              <button key={d.id} className="chip" onClick={() => setActive(i)}>{d.dayIndex}일차</button>
            ))}
          </div>
        </div>

        {/* 가운데: MYRO 유사 리스트 형식 */}
        <div className="results-wrap">
          <div className="results-header">일정 (Day {trip.days[active]?.dayIndex})</div>
          <div className="results-list">
            <div className="place-item">
              <div className="place-actions" style={{gap:8}}>
                <label>시작</label>
                <input type="time" defaultValue={trip.days[active]?.startTime?.slice(0,5) || '09:00'} id="startT" />
                <label>종료</label>
                <input type="time" defaultValue={trip.days[active]?.endTime?.slice(0,5) || '18:00'} id="endT" />
                <button className="chip" onClick={async () => {
                  const id = new URLSearchParams(location.search).get('id');
                  if (!id) return;
                  const start = (document.getElementById('startT') as HTMLInputElement).value;
                  const end = (document.getElementById('endT') as HTMLInputElement).value;
                  await axios.put(`/trips/${id}/days/${trip.days[active].dayIndex}`, null, { params: { startTime: start, endTime: end }});
                  await axios.post(`/trips/${id}/days/${trip.days[active].dayIndex}/recalc`);
                  const { data } = await axios.get<TripEditView>(`/trips/${id}/edit-view`);
                  setTrip(data); setLocalDays(data.days);
                }}>시간 저장/재계산</button>
              </div>
            </div>
            {(localDays[active]?.items ?? []).map((it, i) => (
              <div key={it.id} className="place-item" style={{marginLeft:12}}>
                <div className="place-title">{i+1}. {it.nameSnapshot}</div>
                <div className="place-actions">
                  <button className="chip" onClick={() => {
                    setHistory(h => [...h, localDays.map(d => ({...d, items: [...d.items]}))]);
                    setFuture([]);
                    setLocalDays(prev => {
                      const next = [...prev]; const arr = [...(next[active]?.items ?? [])];
                      if (i === 0) return prev; [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; next[active] = { ...next[active], items: arr } as Day; return next;
                    });
                  }}>▲</button>
                  <button className="chip" onClick={() => {
                    setHistory(h => [...h, localDays.map(d => ({...d, items: [...d.items]}))]);
                    setFuture([]);
                    setLocalDays(prev => {
                      const next = [...prev]; const arr = [...(next[active]?.items ?? [])];
                      if (i >= arr.length-1) return prev; [arr[i+1], arr[i]] = [arr[i], arr[i+1]]; next[active] = { ...next[active], items: arr } as Day; return next;
                    });
                  }}>▼</button>
                </div>
                <div className="place-tags">체류 {it.stayMin ?? 60}분</div>
              </div>
            ))}
            <div className="place-actions" style={{marginTop:12, gap:8}}>
              <button className="btn primary" onClick={async () => {
                const id = new URLSearchParams(location.search).get('id');
                if (!id) return;
                const ids = (localDays[active]?.items ?? []).map(s => s.id);
                await axios.post(`/optimize/day/apply`, ids, { params: { tripId: id, dayIndex: localDays[active].dayIndex } });
                await axios.post(`/trips/${id}/days/${localDays[active].dayIndex}/recalc`);
                const { data } = await axios.get<TripEditView>(`/trips/${id}/edit-view`);
                setTrip(data); setLocalDays(data.days);
                alert('순서 저장 및 경로 재계산 완료');
              }}>변경사항 저장</button>

              <button className="btn" onClick={async () => {
                const id = new URLSearchParams(location.search).get('id');
                if (!id) return;
                // 모든 일차에 대해 순서 유지 적용 + 재계산 호출
                for (const d of localDays) {
                  const ids = (d.items ?? []).map(s => s.id);
                  await axios.post(`/optimize/day/apply`, ids, { params: { tripId: id, dayIndex: d.dayIndex } });
                  await axios.post(`/trips/${id}/days/${d.dayIndex}/recalc`);
                }
                const { data } = await axios.get<TripEditView>(`/trips/${id}/edit-view`);
                setTrip(data); setLocalDays(data.days);
                alert('모든 일차에 일괄 적용 및 재계산 완료');
              }}>모든 일차 일괄적용</button>
            </div>
          </div>
        </div>

        {/* 우측: 지도 */}
        <div className="results-wrap">
          <div className="results-header">지도</div>
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


