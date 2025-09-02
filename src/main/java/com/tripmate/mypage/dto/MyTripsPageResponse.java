package com.tripmate.mypage.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class MyTripsPageResponse {
    private List<MyTripCardResponse> items;
    private Long nextCursorId; // 다음 페이지 없으면 null
}
