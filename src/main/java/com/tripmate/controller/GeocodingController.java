package com.tripmate.controller;

import com.tripmate.service.GeocodingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/geocoding")
@RequiredArgsConstructor
public class GeocodingController {
    
    private final GeocodingService geocodingService;
    
    @GetMapping("/reverse")
    public ResponseEntity<Map<String, Object>> reverseGeocode(
            @RequestParam double lat, 
            @RequestParam double lon
    ) {
        log.info("📍 [GeocodingController] reverseGeocode 호출됨 - lat: {}, lon: {}", lat, lon);
        
        try {
            log.info("📍 [GeocodingController] GeocodingService.getCityFromCoordinates() 호출 시작");
            Map<String, Object> result = geocodingService.getCityFromCoordinates(lat, lon);
            
            log.info("📍 [GeocodingController] GeocodingService 응답 성공 - 결과: {}", result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("📍 [GeocodingController] GeocodingService 호출 실패 - 에러: {}", e.getMessage(), e);
            
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Geocoding failed: " + e.getMessage());
            error.put("timestamp", System.currentTimeMillis());
            
            log.error("📍 [GeocodingController] 에러 응답 반환: {}", error);
            return ResponseEntity.status(500).body(error);
        }
    }
}
