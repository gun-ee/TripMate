package com.tripmate.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.tripmate.entity.TripLeg.TransportMode;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTripRequest {
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private String city;
    private Double cityLat;
    private Double cityLng;
    
    // 기본 설정
    private LocalTime defaultStartTime = LocalTime.of(9, 0);
    private LocalTime defaultEndTime = LocalTime.of(18, 0);
    private TransportMode defaultTransportMode = TransportMode.CAR;
    
    // 일별 일정
    private List<CreateTripDayRequest> days;
}
