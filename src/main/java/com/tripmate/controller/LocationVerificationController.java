package com.tripmate.controller;

import com.tripmate.dto.LocationVerificationRequest;
import com.tripmate.dto.LocationVerificationResponse;
import com.tripmate.service.LocationVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class LocationVerificationController {
    
    private final LocationVerificationService locationVerificationService;
    
    /**
     * GPS 좌표 기반 채팅 권한 확인
     */
    @PostMapping("/verify-chat")
    public ResponseEntity<LocationVerificationResponse> verifyChatLocation(
            @RequestBody LocationVerificationRequest request
    ) {
        log.info("📍 [LocationVerificationController] 채팅 위치 확인 요청 - lat: {}, lon: {}, region: {}, city: {}", 
            request.getLatitude(), request.getLongitude(), request.getRegion(), request.getCity());
        
        try {
            LocationVerificationResponse response = locationVerificationService.verifyLocation(request);
            
            log.info("📍 [LocationVerificationController] 위치 확인 완료 - 채팅 가능: {}, 현재 도시: {}, 채팅방 도시: {}", 
                response.isCanChat(), response.getCurrentCity(), response.getChatRoomCity());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("📍 [LocationVerificationController] 위치 확인 중 오류 발생", e);
            
            LocationVerificationResponse errorResponse = LocationVerificationResponse.builder()
                .canChat(false)
                .currentCity("오류 발생")
                .chatRoomCity(request.getCity())
                .region(request.getRegion())
                .message("위치 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                .timestamp(System.currentTimeMillis())
                .build();
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
