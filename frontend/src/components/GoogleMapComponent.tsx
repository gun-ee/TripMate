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
  onPlaceClick?: (place: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center,
  zoom,
  places,
  onPlaceClick,
  onMapClick,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

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
    if (!map) return;

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

        // 마커 클릭 이벤트
        if (onPlaceClick) {
          marker.addListener('click', () => {
            onPlaceClick(place);
          });
        }

        return marker;
      });

    setMarkers(newMarkers);
  }, [map, places, onPlaceClick]);

  return (
    <div 
      ref={mapRef} 
      className={`google-map ${className}`}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  );
};

export default GoogleMapComponent;
