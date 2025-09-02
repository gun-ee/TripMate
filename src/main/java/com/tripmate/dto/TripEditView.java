package com.tripmate.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripEditView {
    private Long id;
    private String title;
    private String city;
    private Double cityLat;
    private Double cityLng;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime defaultStartTime;
    private LocalTime defaultEndTime;
    private String defaultTransportMode;
    private Long authorId; // 작성자 ID 추가
    private String authorName; // 작성자 이름 추가
    private List<Day> days;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Day {
        private Long id;
        private Integer dayIndex;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private List<Item> items;
        private List<Leg> legs;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long id;
        private Integer sortOrder;
        private String type;
        private String placeSource;
        private String placeRef;
        private String nameSnapshot;
        private Double lat;
        private Double lng;
        private String addrSnapshot;
        private String categorySnapshot;
        private String photoUrlSnapshot;
        private String snapshot;
        private Integer stayMin;
        private String notes;
        private String openTime;
        private String closeTime;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Leg {
        private Long id;
        private Long fromItemId;
        private Long toItemId;
        private Integer distanceM;
        private Integer durationSec;
        private String routePolyline;
        private String calcSource;
        private String calcStatus;
        private LocalDateTime calcAt;
    }
}


