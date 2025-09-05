package com.tripmate.dto;

import com.tripmate.entity.AccompanyPost;
import lombok.*;
import java.time.LocalDateTime;

public class AccompanyPostResponses {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ListItem {
        private Long id;
        private String title;
        private Long authorId;
        private String authorName;
        private Long tripId;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Detail {
        private Long id;
        private Long authorId;
        private String authorName;
        private Long tripId;
        private String title;
        private String content;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    public static ListItem of(AccompanyPost p) {
        return ListItem.builder()
                .id(p.getId())
                .title(p.getTitle())
                .authorId(p.getAuthor().getId())
                .authorName(p.getAuthor().getNickname())
                .tripId(p.getTrip().getId())
                .status(p.getStatus().name())
                .createdAt(p.getCreatedAt())
                .build();
    }

    public static Detail toDetail(AccompanyPost p) {
        return Detail.builder()
                .id(p.getId())
                .authorId(p.getAuthor().getId())
                .authorName(p.getAuthor().getNickname())
                .tripId(p.getTrip().getId())
                .title(p.getTitle())
                .content(p.getContent())
                .status(p.getStatus().name())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
