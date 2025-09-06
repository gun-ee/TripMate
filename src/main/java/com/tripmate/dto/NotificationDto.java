    package com.tripmate.dto;
    import com.tripmate.entity.Notification;
    import com.tripmate.constant.NotificationType;
    import lombok.*;
    import java.time.LocalDateTime;
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public class NotificationDto {
        private Long id;
        private NotificationType type;
        private String message;
        private String linkUrl;
        private boolean read;
        private LocalDateTime createdAt;
        public static NotificationDto of(Notification n) {
            return NotificationDto.builder()
                .id(n.getId()).type(n.getType()).message(n.getMessage())
                .linkUrl(n.getLinkUrl()).read(n.isRead()).createdAt(n.getCreatedAt())
                .build();
        }
    }
    