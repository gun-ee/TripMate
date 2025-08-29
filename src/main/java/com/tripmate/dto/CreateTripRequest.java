package com.tripmate.dto;

import lombok.*;
import java.time.LocalDate;

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
}
