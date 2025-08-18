package com.tripmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeocodingService {
    
    private final RestTemplate restTemplate;
    
    public Map<String, Object> getCityFromCoordinates(double lat, double lon) {
        log.info("📍 [GeocodingService] getCityFromCoordinates 호출됨 - lat: {}, lon: {}", lat, lon);
        
        try {
            // Nominatim API URL 생성
            String url = String.format(
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&zoom=10&addressdetails=1",
                lat, lon
            );
            
            log.info("📍 [GeocodingService] Nominatim API 호출 시작 - URL: {}", url);
            
            // Nominatim API 호출
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            log.info("📍 [GeocodingService] Nominatim API 응답 상태: {}", response.getStatusCode());
            log.info("📍 [GeocodingService] Nominatim API 응답 헤더: {}", response.getHeaders());
            
            // 응답 데이터 검증
            if (response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("📍 [GeocodingService] Nominatim API 응답 본문: {}", responseBody);
                
                // address 정보 확인
                if (responseBody.containsKey("address")) {
                    Object address = responseBody.get("address");
                    log.info("📍 [GeocodingService] address 정보 발견: {}", address);
                    
                    // 도시명 추출 시도
                    if (address instanceof Map) {
                        Map<String, Object> addressMap = (Map<String, Object>) address;
                        log.info("📍 [GeocodingService] address 맵 키들: {}", addressMap.keySet());
                        
                        // 도시명 우선순위로 추출
                        String cityName = extractCityName(addressMap);
                        log.info("📍 [GeocodingService] 추출된 도시명: {}", cityName);
                        
                        // 응답에 도시명 추가
                        responseBody.put("extractedCity", cityName);
                    }
                } else {
                    log.warn("📍 [GeocodingService] address 정보가 응답에 없습니다");
                }
                
                log.info("📍 [GeocodingService] 최종 응답 데이터: {}", responseBody);
                return responseBody;
                
            } else {
                log.error("📍 [GeocodingService] Nominatim API 응답이 비어있습니다");
                throw new RuntimeException("Nominatim API 응답이 비어있습니다");
            }
            
        } catch (Exception e) {
            log.error("📍 [GeocodingService] Nominatim API 호출 실패 - 에러: {}", e.getMessage(), e);
            throw new RuntimeException("Geocoding API 호출 실패: " + e.getMessage());
        }
    }
    
    /**
     * address 맵에서 도시명을 우선순위에 따라 추출
     */
    private String extractCityName(Map<String, Object> addressMap) {
        log.info("📍 [GeocodingService] 도시명 추출 시작 - addressMap: {}", addressMap);
        
        // 도시명 우선순위: city > town > village > county
        String cityName = null;
        
        if (addressMap.containsKey("city")) {
            cityName = String.valueOf(addressMap.get("city"));
            log.info("📍 [GeocodingService] city에서 도시명 추출: {}", cityName);
        } else if (addressMap.containsKey("town")) {
            cityName = String.valueOf(addressMap.get("town"));
            log.info("📍 [GeocodingService] town에서 도시명 추출: {}", cityName);
        } else if (addressMap.containsKey("village")) {
            cityName = String.valueOf(addressMap.get("village"));
            log.info("📍 [GeocodingService] village에서 도시명 추출: {}", cityName);
        } else if (addressMap.containsKey("county")) {
            cityName = String.valueOf(addressMap.get("county"));
            log.info("📍 [GeocodingService] county에서 도시명 추출: {}", cityName);
        } else {
            cityName = "알 수 없는 도시";
            log.warn("📍 [GeocodingService] 도시명을 찾을 수 없어 기본값 사용: {}", cityName);
        }
        
        log.info("📍 [GeocodingService] 최종 추출된 도시명: {}", cityName);
        return cityName;
    }
}
