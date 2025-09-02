// src/pages/PlanPage.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoJsonObject } from 'geojson';
import Header from './Header';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import axios from '../api/axios';
import MapAutoResize from '../components/MapAutoResize';   // 교체본 사용(미세리사이즈 무시)
import MapMoveWatcher from '../components/MapMoveWatcher'; // 교체본 사용(쿨다운/미세이동 가드)

import './PlanPage.css';

/* =========================
 * 타입 & 유틸
 * ========================= */
type Place = {
  id?: string | number;
  name?: string;
  lat?: number | string; lon?: number | string; lng?: number | string;
  x?: number | string; y?: number | string;
  tags?: string;
  otm?: boolean;
};

type ItinStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags?: string;
  durationMin: number;
  isLodging?: boolean;
};

type TransportMode = 'driving' | 'foot' | 'bicycle';
type RouteMode = 'lines' | 'osrm';

const DEFAULT_CENTER: LatLngExpression = [37.5665, 126.9780]; // 서울

const toNum = (v: unknown) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};
const getCoords = (p: Place): [number, number] | null => {
  const lat = toNum(p.lat) ?? toNum(p.y);
  const lng = toNum(p.lon) ?? toNum(p.lng) ?? toNum(p.x);
  if (lat == null || lng == null) return null;
  return [lat, lng];
};
const keyOf = (p: Place, idx: number) => {
  const c = getCoords(p);
  return p.id != null ? String(p.id) : `${p.name ?? 'place'}:${c?.[0] ?? 'na'}:${c?.[1] ?? 'na'}:${idx}`;
};
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10));
  return (h || 0) * 60 + (m || 0);
};
const HHMM = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** center 상태가 바뀔 때 실제 지도를 이동시킴(Plan 시작 시 포함) */
function SetViewOnChange({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center as LatLngExpression, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

/* =========================
 * 페이지 컴포넌트
 * ========================= */
export default function PlanPage() {
  /** 0) 화면 상태 */
  const [isPlanningStarted, setIsPlanningStarted] = useState(false);
  const [editTripId, setEditTripId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [tripAuthorId, setTripAuthorId] = useState<number | null>(null);

  /** 1) 도시/날짜 */
  const [cityQuery, setCityQuery] = useState('');
  const [cityCoord, setCityCoord] = useState<[number, number] | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  /** 2) 지도/검색 */
  const [center, setCenter] = useState<LatLngExpression>(DEFAULT_CENTER);
  const [keyword, setKeyword] = useState<string>('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [limit] = useState<number>(60);
  const [rate] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  /** 3) 일정/경로/교통수단 */
  const [days, setDays] = useState<ItinStop[][]>([[]]);
  const [activeDay, setActiveDay] = useState(0);
  const [routeMode, setRouteMode] = useState<RouteMode>('lines');
  const [transport, setTransport] = useState<TransportMode>('driving');
  const [routeGeo, setRouteGeo] = useState<GeoJsonObject | null>(null);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);

  const mapLat = useMemo(() => (Array.isArray(center) ? Number(center[0]) : 0), [center]);
  const mapLon = useMemo(() => (Array.isArray(center) ? Number(center[1]) : 0), [center]);

  /** 초기 1회만 주변검색(StrictMode 중복 방지) */
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    
    // 편집 모드 확인
    const params = new URLSearchParams(location.search);
    const editId = params.get('editId');
    if (editId) {
      setEditTripId(parseInt(editId));
      loadExistingTrip(parseInt(editId));
    } else {
      fetchNearby(mapLat, mapLon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get('/members/me');
        setCurrentUserId(data.id);
      } catch (error) {
        console.error('현재 사용자 정보 가져오기 실패:', error);
        setCurrentUserId(null);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // 기존 여행 데이터 로드
  const loadExistingTrip = async (tripId: number) => {
    try {
      const { data } = await axios.get(`/trips/${tripId}/edit-view`);
      setCityQuery(data.city);
      setStartDate(data.startDate);
      setEndDate(data.endDate);
      setDayStart(data.defaultStartTime);
      setDayEnd(data.defaultEndTime);
      setTripAuthorId(data.authorId);
      
      // 기존 일정 데이터를 PlanPage 형식으로 변환
      const convertedDays: ItinStop[][] = data.days.map((day: { id: number; items: Array<{ id: number; nameSnapshot: string; lat: number; lng: number; stayMin?: number }> }) => 
        day.items.map((item: { id: number; nameSnapshot: string; lat: number; lng: number; stayMin?: number }) => ({
          id: String(item.id),
          name: item.nameSnapshot,
          lat: item.lat,
          lon: item.lng,
          durationMin: item.stayMin || 60,
          isLodging: false
        }))
      );
      
      setDays(convertedDays);
      setIsPlanningStarted(true);
      
      // 도시명으로 지오코딩하여 지도 중심 설정
      console.log('편집 모드: 도시명으로 지오코딩 시도:', data.city);
      const coords = await geocodeCity(data.city);
      if (coords) {
        console.log('지오코딩 성공:', coords);
        setCityCoord(coords);
        setCenter(coords); // 지도 중심도 함께 설정
        // 지도 중심 변경 후 주변 장소 검색
        setTimeout(() => {
          fetchNearby(coords[0], coords[1]);
        }, 100);
      } else if (convertedDays[0]?.[0]) {
        // 지오코딩 실패 시 첫 번째 장소로 폴백
        console.log('지오코딩 실패, 첫 번째 장소로 폴백:', convertedDays[0][0]);
        const firstPlace = convertedDays[0][0];
        const fallbackCoords = [firstPlace.lat, firstPlace.lon] as [number, number];
        setCityCoord(fallbackCoords);
        setCenter(fallbackCoords); // 지도 중심도 함께 설정
        setTimeout(() => {
          fetchNearby(firstPlace.lat, firstPlace.lon);
        }, 100);
      }
    } catch (error) {
      console.error('기존 여행 데이터 로드 실패:', error);
      fetchNearby(mapLat, mapLon);
    }
  };

  /** 도시 지오코딩(서버 경유 - CORS 회피) */
  const geocodeCity = async (q: string): Promise<[number, number] | null> => {
    try {
      const { data } = await axios.get<{ lat: number; lng: number }>('/places/geocodeCity', { params: { q } });
      if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
        return [data.lat, data.lng];
      }
    } catch {
      // 서버 실패 시 Nominatim로 폴백
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'ko', 'User-Agent': 'TripMate/1.0 (+http://localhost)' } as Record<string, string> });
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length) {
          const { lat, lon } = arr[0];
          return [parseFloat(lat), parseFloat(lon)];
        }
      } catch { /* noop */ }
    }
    return null;
  };

  /** 주변/검색 */
  const fetchNearby = async (lat: number, lon: number) => {
    setLoading(true); setErrorMsg('');
    try {
      const { data } = await axios.get<Place[]>('/places/nearby', { params: { lat, lon, limit, rate } });
      setPlaces(Array.isArray(data) ? data : []);
    } catch { setErrorMsg('주변 장소 조회 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };
  const fetchSearch = async (lat: number, lon: number, q: string) => {
    setLoading(true); setErrorMsg('');
    try {
      const { data } = await axios.get<Place[]>('/places/search', { params: { q, lat, lon, limit, rate } });
      setPlaces(Array.isArray(data) ? data : []);
    } catch { setErrorMsg('검색 처리 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };

  /** 계획 시작: 도시로 이동 + 일수 계산 + (자동검색은 moveend로 처리) */
  const onStartPlan = async () => {
    if (!cityQuery.trim()) {
      alert('여행지를 입력해주세요.');
      return;
    }
    if (!startDate || !endDate) {
      alert('여행 시작일과 종료일을 모두 입력해주세요.');
      return;
    }

    const coord = await geocodeCity(cityQuery);
    if (!coord) return alert('도시를 찾지 못했습니다.');
    setCityCoord(coord);
    setCenter(coord); // SetViewOnChange가 지도 이동 → moveend 발생 → 자동검색 실행
    // 지도 이동 이벤트를 기다리지 않고, 도시 좌표 기준으로 즉시 주변검색/검색 실행
    if (keyword.trim()) await fetchSearch(coord[0], coord[1], keyword.trim());
    else await fetchNearby(coord[0], coord[1]);

    // 날짜→일수
    let dayCount = 1;
    if (startDate && endDate) {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diff = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (24 * 3600 * 1000))) + 1;
      dayCount = Math.max(1, diff);
    }
    setDays(Array.from({ length: dayCount }, () => []));
    setActiveDay(0);
    
    // 계획 시작 상태로 변경
    setIsPlanningStarted(true);
  };

  /** 지도 이동 끝 → 자동 주변검색(쿨다운/미세이동 가드는 MapMoveWatcher에서) */
  const onMapMoveEnd = async (lat: number, lon: number) => {
    const q = keyword.trim();
    if (q) await fetchSearch(lat, lon, q);
    else await fetchNearby(lat, lon);
  };

  /** 일정 편집 */
  const addToDay = (d: number, p: Place, idxForKey: number, asLodging = false, durationMin = 60) => {
    const c = getCoords(p);
    if (!c) return;
    const [plat, plon] = c;
    const id = keyOf(p, idxForKey);
    setDays(prev => {
      const next = [...prev];
      while (next.length <= d) next.push([]);
      next[d] = [...next[d], { id, name: p.name ?? 'Unknown', lat: plat, lon: plon, tags: p.tags, durationMin, isLodging: asLodging }];
      return next;
    });
  };
  const toggleLodging = (d: number, idx: number) => {
    setDays(prev => {
      const next = [...prev];
      const cur = [...(next[d] ?? [])];
      
      // 기존 데이터에 isLodging 속성이 없을 수 있으므로 안전하게 처리
      const currentItem = cur[idx];
      if (!currentItem) return prev;
      
      const isOn = !!currentItem.isLodging;
      
      if (isOn) {
        // 해제: 선택 항목만 false로
        cur[idx] = { ...currentItem, isLodging: false };
      } else {
        // 설정: 해당 항목만 true, 나머지는 false
        for (let i = 0; i < cur.length; i++) {
          cur[i] = { ...cur[i], isLodging: i === idx };
        }
      }
      next[d] = cur;
      return next;
    });
  };
  const setDuration = (d: number, idx: number, m: number) => {
    setDays(prev => {
      const next = [...prev];
      next[d] = next[d].map((s, i) => (i === idx ? { ...s, durationMin: Math.max(0, m) } : s));
      return next;
    });
  };
  const reorder = (d: number, idx: number, dir: -1 | 1) => {
    setDays(prev => {
      const cur = [...(prev[d] ?? [])];
      const j = idx + dir;
      if (j < 0 || j >= cur.length) return prev;
      [cur[idx], cur[j]] = [cur[j], cur[idx]];
      const next = [...prev]; next[d] = cur; return next;
    });
  };
  const removeStop = (d: number, idx: number) => {
    setDays(prev => {
      const cur = [...(prev[d] ?? [])];
      cur.splice(idx, 1);
      const next = [...prev]; next[d] = cur; return next;
    });
  };

  /** 경로(직선/OSRM) */
  const buildStraightLine = (list: ItinStop[]) => list.map(s => [s.lat, s.lon] as [number, number]);
  const fetchOsrmRoute = async (list: ItinStop[]) => {
    const coords = list.map(s => `${s.lon},${s.lat}`).join(';'); // OSRM: lon,lat
    const url = `https://router.project-osrm.org/route/v1/${transport}/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    return json?.routes?.[0]?.geometry ?? null;
  };

  useEffect(() => {
    const list = days[activeDay] ?? [];
    if (list.length < 2) { setRouteLine([]); setRouteGeo(null); return; }
    if (routeMode === 'lines') {
      setRouteGeo(null);
      setRouteLine(buildStraightLine(list));
    } else {
      (async () => {
        try {
          const geom = await fetchOsrmRoute(list);
          if (geom) { setRouteGeo({ type: 'Feature', properties: {}, geometry: geom } as unknown as GeoJsonObject); setRouteLine([]); }
          else { setRouteGeo(null); setRouteLine(buildStraightLine(list)); }
        } catch {
          setRouteGeo(null); setRouteLine(buildStraightLine(list));
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, activeDay, routeMode, transport]);

  /** 하루 시간표 */
  const [dayStart, setDayStart] = useState('09:00');
  const [dayEnd, setDayEnd] = useState('19:00');
  const timetable = useMemo(() => {
    const list = days[activeDay] ?? [];
    let t = minutes(dayStart);
    const end = minutes(dayEnd);
    return list.map((s) => {
      const arrive = t;
      const depart = Math.min(end, arrive + s.durationMin);
      t = depart;
      return { ...s, arrive, depart };
    });
  }, [days, activeDay, dayStart, dayEnd]);

  /** 저장 */

  // 특정 일차에 추가된 장소들을 API 저장 포맷으로 변환
  type CreateTripItemRequest = {
    sortOrder: number;
    type: string;
    placeSource?: string;
    placeRef?: string;
    nameSnapshot: string;
    lat: number;
    lng: number;
    addrSnapshot?: string | null;
    categorySnapshot?: string | null;
    photoUrlSnapshot?: string | null;
    snapshot?: string; // raw json
    stayMin?: number;
    notes?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
  };

  const getDayItems = (dayIndex: number): CreateTripItemRequest[] => {
    const list = days[dayIndex - 1] ?? [];
    return list.map((s, i) => ({
      sortOrder: i + 1,
      type: 'place',
      placeSource: 'custom',
      placeRef: String(s.id ?? ''),
      nameSnapshot: s.name,
      lat: s.lat,
      lng: s.lon,
      stayMin: s.durationMin,
      notes: s.isLodging ? '숙소' : undefined,
      snapshot: JSON.stringify({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, tags: s.tags, isLodging: s.isLodging })
    }));
  };

  const formatDateOffset = (base: string, offsetDays: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  // 현재 일차 최적화 (백엔드 TSP/스케줄러 호출 → 순서 재배치)
  type DayOptimizeResponse = {
    order: number[];
  };
  const optimizeActiveDay = async () => {
    const list = days[activeDay] ?? [];
    if (list.length < 2) return;

    const mode = (transport === 'foot') ? 'WALK' : 'CAR';
    // 임시 ID(1..n)를 매겨서 서버 응답의 order를 인덱스로 사용
    const stops = list.map((s, idx) => ({
      id: idx + 1,
      lat: s.lat,
      lng: s.lon,
      stayMin: s.durationMin,
      open: null as unknown as string | null,
      close: null as unknown as string | null,
      locked: !!s.isLodging,
    }));

    try {
      const { data } = await axios.post<DayOptimizeResponse>('optimize/day', {
        mode,
        startTime: dayStart,
        endTime: dayEnd,
        startId: null,
        endId: null,
        stops,
      });
      const order = Array.isArray(data?.order) ? data.order : [];
      if (order.length !== list.length) return;
      const byTmpId = (id: number) => list[id - 1];
      const reordered = order.map(byTmpId);
      setDays(prev => {
        const next = [...prev];
        next[activeDay] = reordered;
        return next;
      });
    } catch (e) {
      console.error(e);
      alert('최적화 중 오류가 발생했습니다.');
    }
  };

  const savePlan = async () => {
    try {
      // JWT 토큰 가져오기
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 편집 모드에서 작성자 권한 확인
      if (editTripId && currentUserId !== tripAuthorId) {
        alert('이 여행계획을 편집할 권한이 없습니다.');
        return;
      }
      
      // 여행 일정 데이터 구성 - 실제 사용자가 선택한 장소들로 구성
      const tripData = {
          title: `${cityQuery} 여행`,
          startDate,
          endDate,
          city: cityQuery,
          cityLat: cityCoord?.[0],
          cityLng: cityCoord?.[1],
          defaultStartTime: dayStart,
          defaultEndTime: dayEnd,
          defaultTransportMode: 'CAR',
          days: Array.from({ length: days.length }, (_, i) => ({
            dayIndex: i + 1,
            date: formatDateOffset(startDate, i),
            startTime: dayStart,
            endTime: dayEnd,
            items: getDayItems(i + 1)
          }))
      };
      
      let data;
      if (editTripId) {
        // 편집 모드: 기존 여행 업데이트
        data = await axios.put(`/trips/${editTripId}`, tripData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
      } else {
        // 새 여행 생성
        data = await axios.post('/trips', tripData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
      }
      
      // 저장 직후 결과 화면으로 이동
      console.log('API 응답 데이터:', data);
      console.log('편집 모드 ID:', editTripId);
      
      // API 응답에서 ID 추출
      let id = editTripId;
      if (!id && data && (data as any).data) {
        id = (data as any).data.id;
      }
      
      console.log('최종 ID:', id);
      
      if (id) {
        window.location.href = `/trip/result?id=${id}`;
        return;
      }
      
      // ID가 없는 경우 임시 해결책: 저장 성공 메시지와 함께 새로고침
      alert('저장 완료! 잠시 후 결과 페이지로 이동합니다.');
      
      // 2초 후 메인 페이지로 이동 (또는 사용자가 직접 결과 페이지로 이동)
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (e: unknown) { 
      console.error(e);
      // 타입 단언 최소화
      const resp = (e as { response?: { status?: number } } | undefined)?.response;
      if (resp?.status === 401) {
        alert('인증이 필요합니다. 다시 로그인해주세요.');
      } else {
        alert('저장 실패');
      }
    }
  };

  /* =========================
   * 렌더
   * ========================= */
  return (
    <div className="plan-page">
      <Header />
      
      {!isPlanningStarted ? (
        /* 여행지/날짜 입력 화면 */
        <div className="plan-input-section">
          <div className="plan-input-header">
            <h1>여행 계획 시작하기</h1>
            <p>어디로 떠나시나요? 날짜를 선택하고 계획을 시작하세요.</p>
          </div>
          
          <div className="plan-input-form">
            <div className="input-group">
              <label>여행지</label>
              <input 
                className="city-input" 
                placeholder="도시(제주, 파리, 독일…)"
                value={cityQuery} 
                onChange={(e) => setCityQuery(e.target.value)} 
              />
            </div>
            
            <div className="date-inputs">
              <div className="input-group">
                <label>시작일</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <label>종료일</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>
            
            <button className="start-plan-btn" onClick={onStartPlan}>
              여행 계획 시작하기
            </button>
          </div>
        </div>
      ) : (
        /* 기존 여행계획짜기 화면 */
        <>
        
          {/* 상단 바 */}
          {/*
          <div className="topbar">
            <div className="brand">TRIPMATE</div>
            <div className="grow" />
            <button className="btn ghost" onClick={() => setIsPlanningStarted(false)}>처음으로</button>

            <button className="btn primary" onClick={savePlan}>DB 저장</button>
          </div>
          */}
          {/* 도시/날짜/검색/설정 */}
          <div className="plan-controls">
            <input className="city-input" placeholder="도시(제주, 파리, 독일…)"
                   value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} />
            <div className="date-range">
              <label>시작</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <label>종료</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className="btn" onClick={onStartPlan}>계획 시작</button>

            <div className="spacer" />

            <input className="keyword-input" placeholder="키워드(없으면 주변)"
                   value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <button className="btn" onClick={() => {
              const q = keyword.trim();
              if (q) fetchSearch(mapLat, mapLon, q);
              else fetchNearby(mapLat, mapLon);
            }}>검색/주변</button>

            <select className="btn" value={transport} onChange={(e) => setTransport(e.target.value as TransportMode)}>
              <option value="driving">차량</option>
              <option value="foot">도보</option>
              <option value="bicycle">자전거</option>
            </select>
            <select className="btn" value={routeMode} onChange={(e) => setRouteMode(e.target.value as RouteMode)}>
              <option value="lines">직선</option>
              <option value="osrm">도로</option>
            </select>
          </div>

          {/* 시간/일차 스위치 */}
          <div className="timebar">
            <div>
              <label>일과 시작</label>
              <input type="time" value={dayStart} onChange={(e) => setDayStart(e.target.value)} />
              <label style={{ marginLeft: 12 }}>종료</label>
              <input type="time" value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} />
            </div>
            <div className="dayswitch">
              <button className="icon-btn" onClick={() => setActiveDay(d => Math.max(0, d-1))}>◀</button>
              <span className="day-label">{activeDay + 1}일차 / {days.length}</span>
              <button className="icon-btn" onClick={() => setActiveDay(d => Math.min(days.length-1, d+1))}>▶</button>
            </div>
          </div>

          {/* 본문: 지도 / 검색 / 일정 */}
          <div className="plan-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
            {/* 지도 */}
            <div className="map-wrap">
              <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
                <MapAutoResize />
                <SetViewOnChange center={center} zoom={12} />
                <MapMoveWatcher onMoveEnd={onMapMoveEnd} /> {/* 지도 이동 시 자동검색 */}

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 검색 마커 */}
                {places.map((p, idx) => {
                  const k = keyOf(p, idx);
                  const c = getCoords(p);
                  if (!c) return null;
                  return (
                    <Marker key={k} position={c as LatLngExpression}>
                      <Popup>
                        <b>{p.name ?? 'Unknown'}</b>
                        {p.tags && <div style={{ marginTop: 4, fontSize: 12 }}>{p.tags}</div>}
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="chip" onClick={() => addToDay(activeDay, p, idx)}>추가</button>
                          <button className="chip" onClick={() => addToDay(activeDay, p, idx, true)}>숙소</button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* 경로 */}
                {routeLine.length >= 2 && <Polyline positions={routeLine as LatLngExpression[]} />}
                {routeGeo && <GeoJSON data={routeGeo} />}
              </MapContainer>
            </div>

            {/* 검색 결과 */}
            <div className="results-wrap">
              <div className="results-header">검색 결과</div>
              {loading && <div className="results-empty">로딩 중…</div>}
              {!loading && errorMsg && <div className="results-error">{errorMsg}</div>}
              {!loading && !errorMsg && places.length === 0 && <div className="results-empty">데이터가 없습니다.</div>}
              {!loading && !errorMsg && places.length > 0 && (
                <div className="results-list">
                  {places.map((p, idx) => {
                    const k = keyOf(p, idx);
                    return (
                      <div key={k} className="place-item">
                        <div className="place-title">{p.name ?? 'Unknown'}</div>
                        {p.tags && <div className="place-tags">{p.tags}</div>}
                        <div className="place-actions" style={{justifyContent:'flex-end'}}>
                          <button className="chip" onClick={() => addToDay(activeDay, p, idx)}>추가</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 일정 패널 */}
            <div className="results-wrap">
              <div className="results-header">일정 (Day {activeDay + 1})</div>
              {(days[activeDay] ?? []).length === 0 ? (
                <div className="results-empty">선택된 장소가 없습니다.</div>
              ) : (
                <div className="results-list">
                  {(days[activeDay] ?? []).map((s, i) => (
                    <div key={`${s.id}:${i}`} className="place-item">
                      <div className="place-title">
                        {i + 1}. {s.name} {s.isLodging && <span className="badge">숙소</span>}
                      </div>
                      <div className="place-tags">
                        체류 {s.durationMin}분 / 도착 {HHMM(timetable[i]?.arrive ?? 0)} ~ 출발 {HHMM(timetable[i]?.depart ?? 0)}
                      </div>
                      <div className="place-actions">
                        <button className="chip" onClick={() => reorder(activeDay, i, -1)}>▲</button>
                        <button className="chip" onClick={() => reorder(activeDay, i, 1)}>▼</button>
                        <button className="chip" onClick={() => toggleLodging(activeDay, i)}>
                          {s.isLodging ? '숙소 해제' : '숙소 설정'}
                        </button>
                        <button className="chip" onClick={() => setDuration(activeDay, i, s.durationMin + 30)}>+30m</button>
                        <button className="chip" onClick={() => setDuration(activeDay, i, Math.max(0, s.durationMin - 30))}>-30m</button>
                        <button className="chip" onClick={() => removeStop(activeDay, i)}>삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 하단 */}
          <div className="plan-footer">
            <div className="hint">교통수단: {transport} / 경로: {routeMode}</div>
            <div className="grow" />
            <button className="btn" onClick={optimizeActiveDay}>현재 일차 최적화</button>
            {/* 편집 모드에서는 작성자만 저장 버튼 표시, 새 여행 생성은 모든 로그인 사용자 가능 */}
            {(!editTripId || currentUserId === tripAuthorId) && (
              <button className="btn primary" onClick={savePlan}>
                {editTripId ? '여행계획 수정' : '여행계획 저장'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
