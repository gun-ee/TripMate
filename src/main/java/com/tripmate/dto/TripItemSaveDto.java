package com.tripmate.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripItemSaveDto {
    private Integer dayIndex;
    private Integer sortOrder;
    private String type;           // place|memo|transfer|lodging
    private String placeSource;    // kakao|otm|custom
    private String placeRef;
    private String name;
    private Double lat;
    private Double lng;
    private String address;
    private String category;
    private String photoUrl;
    private String rawJson;        // vendor raw json (stringified)
    private Integer stayMin;
    private String notes;
    private String openTime;       // "HH:mm" | null
    private String closeTime;      // "HH:mm" | null
}
