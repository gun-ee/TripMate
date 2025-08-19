package com.tripmate.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionChatMessageResponse {
    
    private Long id;
    private String content;
    private Long memberId;
    private String memberName;
    private String memberProfileImg;
    private String city;
    private LocalDateTime createdAt;
}

