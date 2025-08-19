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
        
        // 국가별 도시명 정제
        String country = getCountryFromAddress(addressMap);
        String cleanedCityName = cleanCityName(cityName, country);
        
        log.info("📍 [GeocodingService] 국가: {}, 원본 도시명: {}, 정제된 도시명: {}", country, cityName, cleanedCityName);
        log.info("📍 [GeocodingService] 최종 추출된 도시명: {}", cleanedCityName);
        
        return cleanedCityName;
    }
    
    /**
     * address 맵에서 국가 정보 추출
     */
    private String getCountryFromAddress(Map<String, Object> addressMap) {
        if (addressMap.containsKey("country")) {
            return String.valueOf(addressMap.get("country"));
        }
        return "알 수 없는 국가";
    }
    
    /**
     * 국가별로 도시명 정제
     * 한국만 행정구역명 제거, 외국은 원본 그대로
     */
    private String cleanCityName(String cityName, String country) {
        if (cityName == null) return "알 수 없는 도시";
        
        log.info("📍 [GeocodingService] 도시명 정제 시작 - 도시명: {}, 국가: {}", cityName, country);
        
        // 한국만 행정구역명 제거
        if ("대한민국".equals(country)) {
            log.info("📍 [GeocodingService] 한국 도시명 정제 시작");
            
            if (cityName.endsWith("광역시")) {
                String cleaned = cityName.replace("광역시", "");
                log.info("📍 [GeocodingService] 광역시 제거: {} → {}", cityName, cleaned);
                return cleaned;
            }
            if (cityName.endsWith("특별시")) {
                String cleaned = cityName.replace("특별시", "");
                log.info("📍 [GeocodingService] 특별시 제거: {} → {}", cityName, cleaned);
                return cleaned;
            }
            if (cityName.endsWith("특별자치도")) {
                String cleaned = cityName.replace("특별자치도", "");
                log.info("📍 [GeocodingService] 특별자치도 제거: {} → {}", cityName, cleaned);
                return cleaned;
            }
            if (cityName.endsWith("특별자치시")) {
                String cleaned = cityName.replace("특별자치시", "");
                log.info("📍 [GeocodingService] 특별자치시 제거: {} → {}", cityName, cleaned);
                return cleaned;
            }
            
            log.info("📍 [GeocodingService] 한국 도시명 정제 완료 (변경 없음): {}", cityName);
        } else {
            log.info("📍 [GeocodingService] 외국 도시명 - 영어→한글 변환 시도");
            String translatedCityName = translateCityName(cityName, country);
            if (!cityName.equals(translatedCityName)) {
                log.info("📍 [GeocodingService] 도시명 변환: {} → {}", cityName, translatedCityName);
                return translatedCityName;
            }
            log.info("📍 [GeocodingService] 외국 도시명 - 변환 없음, 원본 그대로: {}", cityName);
        }
        
        return cityName;
    }
    
    /**
     * 영어 도시명을 한글로 변환
     */
    private String translateCityName(String englishCityName, String country) {
        log.info("📍 [GeocodingService] 도시명 번역 시작 - 영어: {}, 국가: {}", englishCityName, country);
        
        // 일본 도시들
        if ("Japan".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "tokyo": return "도쿄";
                case "osaka": return "오사카";
                case "fukuoka": return "후쿠오카";
                case "sapporo": return "삿포로";
            }
        }
        
        // 동남아 도시들
        if ("Myanmar".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "yangon": return "미얀마";
            }
        }
        if ("Laos".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "vientiane": return "라오스";
            }
        }
        if ("Vietnam".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "hanoi": return "베트남";
                case "ho chi minh city": return "베트남";
            }
        }
        if ("Thailand".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "bangkok": return "태국";
                case "chiang mai": return "태국";
            }
        }
        if ("Taiwan".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "taipei": return "대만";
                case "kaohsiung": return "대만";
            }
        }
        
        // 유럽 도시들
        if ("Germany".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "berlin": return "독일";
                case "munich": return "독일";
                case "hamburg": return "독일";
            }
        }
        if ("Spain".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "madrid": return "스페인";
                case "barcelona": return "스페인";
                case "seville": return "스페인";
            }
        }
        if ("United Kingdom".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "london": return "영국";
                case "manchester": return "영국";
                case "edinburgh": return "영국";
            }
        }
        if ("Italy".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "rome": return "이탈리아";
                case "milan": return "이탈리아";
                case "florence": return "이탈리아";
            }
        }
        if ("Czech Republic".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "prague": return "체코";
                case "brno": return "체코";
            }
        }
        if ("France".equals(country)) {
            switch (englishCityName.toLowerCase()) {
                case "paris": return "프랑스";
                case "marseille": return "프랑스";
                case "lyon": return "프랑스";
            }
        }
        
        log.info("📍 [GeocodingService] 도시명 번역 실패 - 지원하지 않는 도시: {} (국가: {})", englishCityName, country);
        return englishCityName; // 변환할 수 없으면 원본 반환
    }
}
