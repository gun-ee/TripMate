package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import com.tripmate.entity.TripDay;
import com.tripmate.entity.TripLeg.TransportMode;

@Entity
@Table(name = "trip")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Trip {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private LocalDate startDate;
    private LocalDate endDate;

    private String city;
    private Double cityLat;
    private Double cityLng;
    // 여행 기준 시간대 (예: "Asia/Seoul")
    private String timeZone;
    
    // Member와의 관계 추가
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private Member member;
    
    // 일별 일정 관리
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayIndex ASC")
    private List<TripDay> days = new ArrayList<>();
    
    // 기본 설정
    private LocalTime defaultStartTime = LocalTime.of(9, 0); // 기본 일과 시작 시간
    private LocalTime defaultEndTime = LocalTime.of(18, 0);   // 기본 일과 종료 시간
    
    @Enumerated(EnumType.STRING)
    private TransportMode defaultTransportMode = TransportMode.CAR; // 기본 이동 수단
    
    // 생성/수정 시간 추가
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Version
    private Long version;
    
    // 기본값 설정을 위한 메서드
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
