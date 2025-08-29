package com.tripmate.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayOptimizeResponse {
    private List<Long> order;
    private List<Leg> itinerary;
    private double totalTravelSec;
    private int totalStayMin;
    private int totalWaitMin;
    private boolean timeWindowViolated;
    private Map<String,Object> geometry; // GeoJSON LineString (OSRM)

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Leg {
        private Long id;
        private String arrive;  // "HH:mm"
        private String depart;  // "HH:mm"
        private int waitMin;
    }
}
