package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "trip_item",
    indexes = {
        @Index(name = "idx_trip_day_order", columnList = "trip_id, dayIndex, sortOrder")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private Integer dayIndex;

    @Column(nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private String type; // place|memo|transfer|lodging

    private String placeSource; // kakao|otm|custom
    private String placeRef;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String nameSnapshot;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(columnDefinition = "TEXT")
    private String addrSnapshot;

    @Column(columnDefinition = "TEXT")
    private String categorySnapshot;

    @Column(columnDefinition = "TEXT")
    private String photoUrlSnapshot;

    @Lob
    @Column(nullable = false, columnDefinition = "longtext")
    private String snapshot; // raw vendor json (string)

    private Integer stayMin;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime capturedAt;

    // optional open/close time in "HH:mm"
    private String openTime;
    private String closeTime;
}
