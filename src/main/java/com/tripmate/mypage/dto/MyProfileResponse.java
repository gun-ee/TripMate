package com.tripmate.mypage.dto;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class MyProfileResponse {
    private Long memberId;
    private String displayName;        // nickname
    private String username;           // 화면용 핸들 (닉네임 or email local-part)
    private String avatarUrl;          // profileImg (없으면 null)

    private long tripCount;            // 여행 수
    private long totalPlaceCount;      // 방문지 수 (TripItem 합)
    private long upcomingTripCount;    // 오늘 이후 시작
}
