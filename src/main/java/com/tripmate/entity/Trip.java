package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

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
}
