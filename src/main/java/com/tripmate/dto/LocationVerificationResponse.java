package com.tripmate.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class LocationVerificationResponse {
    private boolean canChat;           // 채팅 가능 여부
    private String currentCity;        // 현재 위치한 도시
    private String chatRoomCity;       // 채팅방 도시
    private String region;             // 지역
    private String message;            // 안내 메시지
    private long timestamp;            // 응답 시간
}
