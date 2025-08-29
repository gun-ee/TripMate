package com.tripmate.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayOptimizeRequest {
    private String mode;        // WALK | CAR
    private String startTime;   // "HH:mm"
    private String endTime;     // "HH:mm"
    private Long startId;       // optional anchor start
    private Long endId;         // optional anchor end
    private List<Stop> stops;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Stop {
        private Long id;
        private double lat;
        private double lng;
        private Integer stayMin;     // default 60
        private String open;         // "HH:mm" | null
        private String close;        // "HH:mm" | null
        private boolean locked;
    }
}
