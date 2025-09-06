package com.tripmate.dto;

import com.tripmate.entity.AccompanyComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class AccompanyCommentDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long postId;
        private Long authorId;
        private String authorName;
        private String authorNickname;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String profileImage;
        private Boolean isDeleted;

        public static Response of(AccompanyComment comment) {
            return Response.builder()
                    .id(comment.getId())
                    .postId(comment.getPost().getId())
                    .authorId(comment.getAuthor().getId())
                    .authorName(comment.getAuthor().getNickname())
                    .authorNickname(comment.getAuthor().getNickname())
                    .content(comment.getContent())
                    .createdAt(comment.getCreatedAt())
                    .updatedAt(comment.getUpdatedAt())
                    .profileImage(comment.getAuthor().getProfileImg())
                    .isDeleted(comment.getIsDeleted())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private List<Response> comments;
        private int totalCount;
    }
}
