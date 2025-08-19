import { useState, useCallback } from 'react';
import axiosInstance from '../api/axios';

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useGPSLocation = () => {
  const [currentGPSLocation, setCurrentGPSLocation] = useState<GPSLocation | null>(null);
  const [currentCity, setCurrentCity] = useState<string>('');
  const [isGPSLoading, setIsGPSLoading] = useState(false);

  // Nominatim API를 사용해서 GPS 좌표를 도시명으로 변환
  const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    try {
      console.log('📍 [useGPSLocation] 백엔드 API 호출 시작:', `/geocoding/reverse?lat=${lat}&lon=${lon}`);
      
      // 백엔드 프록시를 통해 Nominatim API 호출 (CORS 문제 해결)
      const response = await axiosInstance.get(`/geocoding/reverse?lat=${lat}&lon=${lon}`);
      
      if (response.data && response.data.address) {
        const data = response.data;
        console.log('📍 [useGPSLocation] 응답 데이터:', data);
        
        // 백엔드에서 추출한 도시명이 있으면 사용
        if (data.extractedCity) {
          console.log('📍 [useGPSLocation] 백엔드에서 추출한 도시명:', data.extractedCity);
          return data.extractedCity;
        }
        
        // 도시명 우선순위: city > town > village > county
        const cityName = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.county || 
                        '알 수 없는 도시';
        
        return cityName;
      } else {
        throw new Error('API 응답 데이터 형식이 올바르지 않습니다');
      }
      
    } catch (error: any) {
      console.error('📍 [useGPSLocation] 도시명 변환 실패:', error);
      
      // 에러 상세 정보 출력
      if (error.response) {
        console.error('  - 응답 상태:', error.response.status);
        console.error('  - 응답 데이터:', error.response.data);
      } else if (error.request) {
        console.error('  - 요청 에러:', error.request);
      } else {
        console.error('  - 에러 메시지:', error.message);
      }
      
      // 에러 발생 시 기본값 반환 (테스트용)
      if (lat >= 37.4 && lat <= 37.6 && lon >= 126.6 && lon <= 126.8) {
        console.log('📍 [useGPSLocation] 에러 발생으로 인한 기본값 사용: 인천');
        return '인천';
      }
      
      return '알 수 없는 도시';
    }
  };

  // GPS 위치 가져오기 함수
  const getCurrentLocation = useCallback(async (): Promise<string | null> => {
    // 이미 위치를 가져온 상태라면 중복 요청 방지
    if (currentCity && currentCity !== '') {
      console.log('📍 [useGPSLocation] 이미 위치 정보가 있어서 중복 요청 방지:', currentCity);
      return currentCity;
    }
    
    setIsGPSLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation이 지원되지 않습니다'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,  // 높은 정확도
            timeout: 10000,           // 10초 타임아웃
            maximumAge: 60000         // 1분 캐시
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      setCurrentGPSLocation({
        latitude,
        longitude,
        accuracy
      });

      // 브라우저 콘솔에 GPS 좌표 출력
      console.log('📍 [useGPSLocation] GPS 위치 감지 성공:');
      console.log('  - 위도:', latitude);
      console.log('  - 경도:', longitude);
      console.log('  - 정확도:', accuracy, 'm');
      
      // GPS 좌표로 도시명 가져오기
      console.log('📍 [useGPSLocation] 도시명 변환 시작...');
      const cityName = await getCityFromCoordinates(latitude, longitude);
      setCurrentCity(cityName);
      
      console.log('📍 [useGPSLocation] 현재 위치한 도시:', cityName);
      return cityName;
      
    } catch (error) {
      console.error('📍 [useGPSLocation] GPS 위치 가져오기 실패:', error);
      
      // 에러 상세 정보도 콘솔에 출력
      if (error instanceof GeolocationPositionError) {
        console.error('  - 에러 코드:', error.code);
        console.error('  - 에러 메시지:', error.message);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('  - 원인: 위치 접근 권한이 거부됨');
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('  - 원인: 위치 정보를 사용할 수 없음');
            break;
          case error.TIMEOUT:
            console.error('  - 원인: 위치 정보 요청 시간 초과');
            break;
          default:
            console.error('  - 원인: 알 수 없는 오류');
        }
      }
      return null;
    } finally {
      setIsGPSLoading(false);
    }
  }, [currentCity]);

  return {
    currentGPSLocation,
    currentCity,
    isGPSLoading,
    getCurrentLocation,
    getCityFromCoordinates
  };
};
