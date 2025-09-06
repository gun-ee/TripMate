package com.tripmate.dto;

import com.tripmate.entity.Post;
import com.tripmate.entity.AccompanyPost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class MyPostsResponses {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllPosts {
        private List<TripTalkPost> tripTalkPosts;
        private List<AccompanyPostItem> accompanyPosts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripTalkPost {
        private Long id;
        private String content;
        private String imageUrl;
        private int likeCount;
        private int commentCount;
        private LocalDateTime createdAt;
        private String type = "TRIPTALK";

        public static TripTalkPost of(Post post) {
            return TripTalkPost.builder()
                    .id(post.getId())
                    .content(post.getContent())
                    .imageUrl(post.getImageUrl())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .createdAt(post.getCreatedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccompanyPostItem {
        private Long id;
        private String title;
        private String content;
        private String status;
        private int applicationCount;
        private int commentCount;
        private LocalDateTime createdAt;
        private String type = "ACCOMPANY";

        public static AccompanyPostItem of(AccompanyPost post, int applicationCount, int commentCount) {
            return AccompanyPostItem.builder()
                    .id(post.getId())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .status(post.getStatus().name())
                    .applicationCount(applicationCount)
                    .commentCount(commentCount)
                    .createdAt(post.getCreatedAt())
                    .build();
        }
    }
}
