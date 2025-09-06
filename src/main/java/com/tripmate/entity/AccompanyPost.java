package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "accompanyPost", indexes = {
        @Index(name = "idx_accompany_author", columnList = "authorId"),
        @Index(name = "idx_accompany_status", columnList = "status"),
        @Index(name = "idx_accompany_trip", columnList = "tripId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccompanyPost extends BaseTimeEntity {

    public enum Status { OPEN, CLOSED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorId", nullable = false)
    private Member author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tripId", nullable = false)
    private Trip trip;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob @Column(nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.OPEN;

    // 댓글 연관관계
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccompanyComment> comments;
}
