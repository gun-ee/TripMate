package com.tripmate.dto;

import com.tripmate.entity.AccompanyApplication;
import com.tripmate.entity.AccompanyPost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AccompanyApplicationResponses {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationItem {
        private Long id;
        private String applicantName;
        private String applicantNickname;
        private String message;
        private String status;
        private LocalDateTime createdAt;
        private String profileImage;

        public static ApplicationItem of(AccompanyApplication application) {
            return ApplicationItem.builder()
                    .id(application.getId())
                    .applicantName(application.getApplicant().getNickname()) // name 대신 nickname 사용
                    .applicantNickname(application.getApplicant().getNickname())
                    .message(application.getMessage())
                    .status(application.getStatus().name())
                    .createdAt(application.getCreatedAt())
                    .profileImage(application.getApplicant().getProfileImg())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostWithApplications {
        private Long postId;
        private String postTitle;
        private String postStatus;
        private int applicationCount;
        private LocalDateTime createdAt;

        public static PostWithApplications of(AccompanyPost post, int applicationCount) {
            return PostWithApplications.builder()
                    .postId(post.getId())
                    .postTitle(post.getTitle())
                    .postStatus(post.getStatus().name())
                    .applicationCount(applicationCount)
                    .createdAt(post.getCreatedAt())
                    .build();
        }
    }
}
