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
    private String authorId;
    private String authorName;
    private String authorProfileImg;
    private String authorLocation;
    private String region;
    private String city;
    private LocalDateTime createdAt;
    private Boolean isDeleted;
}

