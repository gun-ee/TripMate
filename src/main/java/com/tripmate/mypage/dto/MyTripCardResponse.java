package com.tripmate.mypage.dto;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class MyTripCardResponse {
    private Long id;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer placeCount;        // TripItem 수 합계
    private String coverImageUrl;      // 프로젝트에 없으면 null 유지
    private boolean isPublic;          // 공개여부 필드 없으면 true 고정
}
