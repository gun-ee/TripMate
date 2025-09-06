package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accompanyComment", indexes = {
        @Index(name = "idx_comment_post", columnList = "postId"),
        @Index(name = "idx_comment_author", columnList = "authorId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccompanyComment extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postId", nullable = false)
    private AccompanyPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorId", nullable = false)
    private Member author;

    @Lob @Column(nullable = false)
    private String content;

    // 대댓글을 위한 필드 (선택사항)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parentId")
    private AccompanyComment parent;

    // 삭제 여부 (soft delete)
    @Column(nullable = false)
    private Boolean isDeleted = false;
}
