package com.tripmate.dto;

import com.tripmate.entity.AccompanyApplication;
import lombok.*;
import java.time.LocalDateTime;

public class AccompanyApplicationDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ApplyReq {
        private String message;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long id;
        private Long postId;
        private Long applicantId;
        private String applicantName;
        private String message;
        private String status;
        private LocalDateTime createdAt;
    }

    public static Item of(AccompanyApplication a) {
        return Item.builder()
                .id(a.getId())
                .postId(a.getPost().getId())
                .applicantId(a.getApplicant().getId())
                .applicantName(a.getApplicant().getNickname())
                .message(a.getMessage())
                .status(a.getStatus().name())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
