package com.tripmate.dto;

import lombok.Data;

@Data
public class LocationVerificationRequest {
    private double latitude;      // GPS 위도
    private double longitude;     // GPS 경도
    private String region;        // 채팅방 지역 (예: 대한민국, 일본)
    private String city;          // 채팅방 도시 (예: 서울, 도쿄)
}
