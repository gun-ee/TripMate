package com.tripmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostListResponse {
    
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private String authorName;
    private String authorProfileImg;
    private LocalDateTime createdAt;
    private int likeCount;
    private int commentCount;
    private boolean isLikedByMe;
}
