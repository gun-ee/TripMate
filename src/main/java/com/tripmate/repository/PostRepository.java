package com.tripmate.repository;

import com.tripmate.entity.Post;
import com.tripmate.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // 활성 상태인 게시글만 조회
    Page<Post> findByStatusOrderByCreatedAtDesc(PostStatus status, Pageable pageable);
    
    // 특정 사용자의 게시글 조회
    Page<Post> findByAuthorIdAndStatusOrderByCreatedAtDesc(Long authorId, PostStatus status, Pageable pageable);
    
    // 제목 또는 내용으로 검색
    @Query("SELECT p FROM Post p WHERE p.status = :status AND (p.title LIKE %:keyword% OR p.content LIKE %:keyword%) ORDER BY p.createdAt DESC")
    Page<Post> findByKeywordAndStatus(@Param("keyword") String keyword, @Param("status") PostStatus status, Pageable pageable);
    
    // 좋아요 수로 정렬
    @Query("SELECT p FROM Post p WHERE p.status = :status ORDER BY SIZE(p.likes) DESC, p.createdAt DESC")
    Page<Post> findByStatusOrderByLikesDesc(PostStatus status, Pageable pageable);
}
