package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorId", nullable = false)
    private Member author;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    private String imageUrl;
    
    // 여행지 구분을 위한 region 필드 추가
    @Column(nullable = false, length = 50)
    private String region;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.ACTIVE;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostLike> likes = new ArrayList<>();
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();
    
    // 좋아요 수 계산
    public int getLikeCount() {
        return likes != null ? likes.size() : 0;
    }
    
    // 댓글 수 계산
    public int getCommentCount() {
        return comments != null ? comments.size() : 0;
    }
    
    // 현재 사용자가 좋아요 했는지 확인
    public boolean isLikedByMember(Long memberId) {
        return likes != null && likes.stream()
                .anyMatch(like -> like.getMember().getId().equals(memberId));
    }
    
    // 댓글 수 증가
    public void incrementCommentCount() {
        // 이 메서드는 JPA가 자동으로 comments.size()를 계산하므로
        // 실제로는 별도 업데이트가 필요하지 않음
    }
    
    // 댓글 수 감소
    public void decrementCommentCount() {
        // 이 메서드는 JPA가 자동으로 comments.size()를 계산하므로
        // 실제로는 별도 업데이트가 필요하지 않음
    }
    
    // 댓글 추가
    public void addComment(Comment comment) {
        if (comments == null) {
            comments = new ArrayList<>();
        }
        comments.add(comment);
        comment.setPost(this);
    }
    
    // 댓글 제거
    public void removeComment(Comment comment) {
        if (comments != null) {
            comments.remove(comment);
            comment.setPost(null);
        }
    }
}
