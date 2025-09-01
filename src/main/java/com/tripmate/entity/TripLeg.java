package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "trip_leg",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_trip_leg_pair", columnNames = {"fromItemId", "toItemId"})
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripLeg {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tripDayId", nullable = false)
    private TripDay tripDay;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fromItemId", nullable = false)
    private TripItem fromItem;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "toItemId", nullable = false)
    private TripItem toItem;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportMode mode = TransportMode.CAR; // CAR, WALK, TRANSIT
    
    private Integer distanceM; // 이동 거리 (미터)
    private Integer durationSec; // 이동 시간 (초)
    
    @Column(columnDefinition = "TEXT")
    private String routePolyline; // 경로 폴리라인 (지도 표시용)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CalcStatus calcStatus = CalcStatus.DIRTY; // DIRTY, OK, FAIL
    
    @Enumerated(EnumType.STRING)
    private CalcSource calcSource; // OSRM, GOOGLE, FALLBACK
    
    private LocalDateTime calcAt; // 계산 시간
    @Version
    private Long version;
    
    // 제약 조건
    @PrePersist
    protected void onCreate() {
        if (calcAt == null) {
            calcAt = LocalDateTime.now();
        }
    }
    
    // 편의 메서드
    public boolean isCalculated() {
        return calcStatus == CalcStatus.OK || calcStatus == CalcStatus.FALLBACK;
    }
    
    public boolean needsCalculation() {
        return calcStatus == CalcStatus.DIRTY;
    }
    
    // 열거형
    public enum TransportMode {
        CAR, WALK, TRANSIT
    }
    
    public enum CalcStatus {
        DIRTY, OK, FAIL, FALLBACK
    }
    
    public enum CalcSource {
        OSRM, GOOGLE, FALLBACK
    }
}
