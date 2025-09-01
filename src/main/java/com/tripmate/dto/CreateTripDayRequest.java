package com.tripmate.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTripDayRequest {
    private Integer dayIndex; // 1일차, 2일차...
    private LocalDate date; // 실제 날짜
    private LocalTime startTime; // 일과 시작 시간
    private LocalTime endTime;   // 일과 종료 시간
    private List<CreateTripItemRequest> items; // 방문 장소 목록
}
