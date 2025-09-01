package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "trip_day",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_trip_day_idx", columnNames = {"tripId", "dayIndex"})
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripDay {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tripId", nullable = false)
    private Trip trip;
    
    @Column(nullable = false)
    private Integer dayIndex; // 1일차, 2일차...
    
    @Column(nullable = false)
    private LocalDate date; // 실제 날짜
    
    private LocalTime startTime; // 일과 시작 시간 (기본값: 09:00)
    private LocalTime endTime;   // 일과 종료 시간 (기본값: 18:00)
    
    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TripItem> items = new ArrayList<>();
    
    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripLeg> legs = new ArrayList<>();
    
    // 일별 요약 정보
    private Integer totalDistance; // 총 이동 거리 (미터)
    private Integer totalDuration; // 총 이동 시간 (초)
    private Integer totalStayTime; // 총 체류 시간 (분)
    @Version
    private Long version;
    
    // 제약 조건
    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            startTime = LocalTime.of(9, 0); // 기본 09:00
        }
        if (endTime == null) {
            endTime = LocalTime.of(18, 0); // 기본 18:00
        }
    }
    
    // 편의 메서드
    public void addItem(TripItem item) {
        items.add(item);
        item.setTripDay(this);
    }
    
    public void removeItem(TripItem item) {
        items.remove(item);
        item.setTripDay(null);
    }
    
    public void addLeg(TripLeg leg) {
        legs.add(leg);
        leg.setTripDay(this);
    }
    
    public void removeLeg(TripLeg leg) {
        legs.remove(leg);
        leg.setTripDay(null);
    }
}
