import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapComponentProps {
  center: { lat: number; lng: number };
  zoom: number;
  places: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    imageUrl?: string;
  }>;
  itinerary?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    order: number;
  }>;
  routeMode?: 'lines' | 'osrm';
  transport?: 'driving' | 'transit';
  onPlaceClick?: (place: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center,
  zoom,
  places,
  itinerary = [],
  routeMode = 'osrm',
  transport = 'driving',
  onPlaceClick,
  onMapClick,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [currentPolyline, setCurrentPolyline] = useState<google.maps.Polyline | null>(null);

  // OSRM API로 경로 계산
  const fetchOSRMRoute = async (coordinates: Array<{lat: number, lng: number}>) => {
    try {
      const coords = coordinates.map(c => `${c.lng},${c.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      console.log('OSRM API 요청:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        console.log('OSRM 경로 계산 성공:', data.routes[0]);
        return data.routes[0].geometry;
      } else {
        console.error('OSRM 경로 계산 실패:', data);
        return null;
      }
    } catch (error) {
      console.error('OSRM API 오류:', error);
      return null;
    }
  };

  // GeoJSON LineString을 Google Maps 좌표로 변환
  const decodeGeometry = (geometry: any) => {
    if (geometry.type === 'LineString' && geometry.coordinates) {
      return geometry.coordinates.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
    }
    return [];
  };

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: "AIzaSyCCdiozCPCmh3UDrM-F6hpPQO-EuhUizTU", // 실제 API 키로 교체
        version: "weekly",
        libraries: ["places"]
      });

      try {
        const google = await loader.load();
        
        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });


          console.log('GoogleMapComponent: 지도 초기화 완료, map 객체 설정');
          setMap(mapInstance);

          // 지도 클릭 이벤트
          if (onMapClick) {
            mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                onMapClick(event.latLng.lat(), event.latLng.lng());
              }
            });
          }
        }
      } catch (error) {
        console.error('Google Maps 로드 실패:', error);
      }
    };

    initMap();
  }, []);

  // 지도 중심점 변경
  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number' && 
        !isNaN(center.lat) && !isNaN(center.lng) && 
        center.lat >= -90 && center.lat <= 90 && 
        center.lng >= -180 && center.lng <= 180) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  // 마커 업데이트
  useEffect(() => {
    if (!map) {
      console.log('GoogleMapComponent: 지도가 없어서 마커 생성 안함');
      return;
    }

    console.log('GoogleMapComponent: 마커 업데이트 시작', { places, map: !!map });

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));

    // 새 마커 생성
    const newMarkers = places
      .filter(place => 
        typeof place.lat === 'number' && typeof place.lng === 'number' && 
        !isNaN(place.lat) && !isNaN(place.lng) && 
        place.lat >= -90 && place.lat <= 90 && 
        place.lng >= -180 && place.lng <= 180
      )
      .map(place => {
        console.log('GoogleMapComponent: 마커 생성 중', place);
        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          title: place.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#26a69a"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 24)
          }
        });
        
        console.log('GoogleMapComponent: 마커 생성 완료', { 
          place: place.name, 
          position: { lat: place.lat, lng: place.lng },
          marker: !!marker,
          map: !!map
        });

        // 마커 클릭 이벤트
        if (onPlaceClick) {
          marker.addListener('click', () => {
            onPlaceClick(place);
          });
        }

        return marker;
      });

    console.log('GoogleMapComponent: 마커 생성 완료', { newMarkersCount: newMarkers.length });
    setMarkers(newMarkers);
  }, [map, places, onPlaceClick]);


  // itinerary 변경 시에만 경로 재계산
  useEffect(() => {
    console.log('GoogleMapComponent: 경로 요청 useEffect 실행', { 
      map: !!map, 
      itineraryLength: itinerary.length,
      itinerary: itinerary 
    });
    
    if (!map || itinerary.length < 2) {
      console.log('GoogleMapComponent: 경로 요청 조건 불만족 - map:', !!map, 'itinerary.length:', itinerary.length);
      // 기존 경로 제거
      if (currentPolyline) {
        currentPolyline.setMap(null);
        setCurrentPolyline(null);
      }
      return;
    }

    // 일정 순서대로 정렬
    const sortedItinerary = [...itinerary].sort((a, b) => a.order - b.order);
    
    // 디버깅: 좌표 데이터 확인
    console.log('일정 데이터:', sortedItinerary);
    console.log('첫 번째 장소 좌표:', { lat: sortedItinerary[0].lat, lng: sortedItinerary[0].lng });
    console.log('마지막 장소 좌표:', { lat: sortedItinerary[sortedItinerary.length - 1].lat, lng: sortedItinerary[sortedItinerary.length - 1].lng });
    
    // 경로 계산 (직선 또는 OSM 도로)
    const calculateRoute = async () => {
      if (routeMode === 'lines') {
        // 직선 경로
        console.log('직선 경로 모드');
        showStraightLine();
      } else {
        // OSM 도로 경로
        try {
          const coords = sortedItinerary.map(place => `${place.lng},${place.lat}`).join(';');
          const transportMode = transport === 'transit' ? 'driving' : transport; // OSRM은 transit 지원 안함
          const url = `https://router.project-osrm.org/route/v1/${transportMode}/${coords}?overview=full&geometries=geojson`;
          
          console.log('OSM 경로 요청:', url);
          
          const response = await fetch(url);
          const data = await response.json();
          
          console.log('OSM 경로 응답:', data);
          
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const geometry = route.geometry;
            
            // GeoJSON을 Google Maps Polyline으로 변환
            const path = geometry.coordinates.map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }));
            
            // 기존 경로 제거
            if (currentPolyline) {
              currentPolyline.setMap(null);
            }
            
            // 도로 경로 표시
            console.log('GoogleMapComponent: 경로 좌표 데이터:', path);
            console.log('GoogleMapComponent: 지도 객체 상태:', { map: !!map, mapType: typeof map });
            
            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: '#26a69a',
              strokeWeight: 4,
              strokeOpacity: 0.8
            });
            
            console.log('GoogleMapComponent: Polyline 객체 생성:', polyline);
            polyline.setMap(map);
            console.log('GoogleMapComponent: Polyline을 지도에 추가 완료');
            setCurrentPolyline(polyline);
            
            // 지도 범위 조정
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => {
              bounds.extend(point);
            });
            map.fitBounds(bounds);
            
            console.log('OSM 도로 경로 표시 성공!');
          } else {
            console.log('OSM 경로를 찾을 수 없어 직선으로 연결합니다.');
            showStraightLine();
          }
        } catch (error) {
          console.error('OSM 경로 요청 실패:', error);
          showStraightLine();
        }
      }
    };
    
    const showStraightLine = () => {
      // 기존 경로 제거
      if (currentPolyline) {
        currentPolyline.setMap(null);
      }
      
      // 직선 경로 표시
      const polyline = new google.maps.Polyline({
        path: sortedItinerary.map(place => ({ lat: place.lat, lng: place.lng })),
        geodesic: true,
        strokeColor: '#ff6b6b', // 직선 경로는 빨간색으로 구분
        strokeWeight: 3,
        strokeOpacity: 0.8
      });
      polyline.setMap(map);
      setCurrentPolyline(polyline);
      
      // 지도 범위 조정
      const bounds = new google.maps.LatLngBounds();
      sortedItinerary.forEach(place => {
        bounds.extend({ lat: place.lat, lng: place.lng });
      });
      map.fitBounds(bounds);
      
      console.log('직선 경로 표시 완료!');
    };
    
    // 경로 계산 실행
    calculateRoute();
  }, [map, JSON.stringify(itinerary.map(item => ({ id: item.id, lat: item.lat, lng: item.lng, order: item.order }))), routeMode, transport]);

  return (
    <div 
      ref={mapRef} 
      className={`google-map ${className}`}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  );
};

export default GoogleMapComponent;
