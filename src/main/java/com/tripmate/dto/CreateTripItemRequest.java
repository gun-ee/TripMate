package com.tripmate.dto;

import lombok.*;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTripItemRequest {
    private Integer sortOrder; // 일자 내 순서
    private String type; // place|memo|transfer|lodging
    private String placeSource; // kakao|otm|custom
    private String placeRef;
    private String nameSnapshot;
    private Double lat;
    private Double lng;
    private String addrSnapshot;
    private String categorySnapshot;
    private String photoUrlSnapshot;
    private String snapshot; // raw vendor json
    private Integer stayMin; // 체류 시간 (분)
    private String notes;
    private String openTime; // "HH:mm" 형식
    private String closeTime; // "HH:mm" 형식
}
