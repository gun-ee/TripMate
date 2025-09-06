    package com.tripmate.entity;
    import com.tripmate.constant.NotificationType;
    import jakarta.persistence.*;
    import lombok.*;
    import java.time.LocalDateTime;
    @Entity @Table(name="notification")
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public class Notification {
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
        @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="member_id", nullable=false) private Member member;
        @Enumerated(EnumType.STRING) @Column(nullable=false,length=40) private NotificationType type;
        @Column(nullable=false,length=500) private String message;
        @Column(length=300) private String linkUrl;
        @Column(nullable=false) private boolean isRead;
        @Column(nullable=false) private LocalDateTime createdAt;
        private LocalDateTime readAt;
        private Long relatedId;
    }
    