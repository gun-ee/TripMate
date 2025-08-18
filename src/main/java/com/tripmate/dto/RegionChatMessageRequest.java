package com.tripmate.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionChatMessageRequest {
    
    private String content;
    private String region;
    private String city;
    private String authorLocation;
}

