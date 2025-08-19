package com.tripmate.service;

import com.tripmate.dto.LocationVerificationRequest;
import com.tripmate.dto.LocationVerificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationVerificationService {
    
    private final GeocodingService geocodingService;
    
    /**
     * GPS 좌표 기반으로 채팅 권한 확인
     */
    public LocationVerificationResponse verifyLocation(LocationVerificationRequest request) {
        log.info("📍 [LocationVerificationService] 위치 확인 시작 - lat: {}, lon: {}, region: {}, city: {}", 
            request.getLatitude(), request.getLongitude(), request.getRegion(), request.getCity());
        
        try {
            // 1. GPS 좌표로 현재 위치한 도시 추출
            Map<String, Object> geocodingResult = geocodingService.getCityFromCoordinates(
                request.getLatitude(), request.getLongitude()
            );
            
            String currentCity = null;
            if (geocodingResult.containsKey("extractedCity")) {
                currentCity = String.valueOf(geocodingResult.get("extractedCity"));
            }
            
            if (currentCity == null || "알 수 없는 도시".equals(currentCity)) {
                log.warn("📍 [LocationVerificationService] GPS 위치에서 도시명을 추출할 수 없음");
                return createResponse(false, "알 수 없는 도시", request.getCity(), request.getRegion(), 
                    "GPS 위치를 확인할 수 없습니다. 위치 서비스를 활성화해주세요.");
            }
            
            log.info("📍 [LocationVerificationService] 현재 위치한 도시: {}", currentCity);
            
            // 2. 채팅방 도시와 현재 위치한 도시 비교
            boolean canChat = currentCity.equals(request.getCity());
            
            // 3. 응답 메시지 생성
            String message = canChat ? 
                String.format("현재 %s에 위치하고 있어 채팅이 가능합니다.", currentCity) :
                String.format("현재 %s에 위치하고 있지만, %s 채팅방에 접근하려고 합니다. 해당 지역에 위치해야 채팅이 가능합니다.", 
                    currentCity, request.getCity());
            
            log.info("📍 [LocationVerificationService] 위치 확인 완료 - 채팅 가능: {}, 메시지: {}", canChat, message);
            
            return createResponse(canChat, currentCity, request.getCity(), request.getRegion(), message);
            
        } catch (Exception e) {
            log.error("📍 [LocationVerificationService] 위치 확인 중 오류 발생", e);
            return createResponse(false, "오류 발생", request.getCity(), request.getRegion(), 
                "위치 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    }
    
    /**
     * 응답 객체 생성
     */
    private LocationVerificationResponse createResponse(boolean canChat, String currentCity, 
                                                      String chatRoomCity, String region, String message) {
        return LocationVerificationResponse.builder()
            .canChat(canChat)
            .currentCity(currentCity)
            .chatRoomCity(chatRoomCity)
            .region(region)
            .message(message)
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
