package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accompanyApplication", indexes = {
        @Index(name = "idx_apply_post", columnList = "postId"),
        @Index(name = "idx_apply_applicant", columnList = "applicantId"),
        @Index(name = "idx_apply_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccompanyApplication extends BaseTimeEntity {

    public enum Status { PENDING, ACCEPTED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postId", nullable = false)
    private AccompanyPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicantId", nullable = false)
    private Member applicant;

    @Lob @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.PENDING;
    
    // 상태 업데이트 메서드
    public void accept() {
        this.status = Status.ACCEPTED;
    }
    
    public void reject() {
        this.status = Status.REJECTED;
    }
}
