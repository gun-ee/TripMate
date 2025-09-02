package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "follow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_follow_follower_following", columnNames = {"followerId", "followingId"})
    },
    indexes = {
        @Index(name = "idx_follow_follower", columnList = "followerId"),
        @Index(name = "idx_follow_following", columnList = "followingId")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Follow {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followerId", nullable = false)
    private Member follower; // 팔로우하는 사람

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followingId", nullable = false)
    private Member following; // 팔로우받는 사람

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
