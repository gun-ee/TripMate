package com.tripmate.repository;

import com.tripmate.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // 특정 게시글의 댓글 조회 (최상위 댓글만)
    Page<Comment> findByPostIdAndParentIsNullOrderByCreatedAtDesc(Long postId, Pageable pageable);
    
    // 특정 게시글의 댓글 수
    long countByPostId(Long postId);
    
    // 특정 사용자의 댓글 조회
    Page<Comment> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);
    
    // 특정 게시글의 모든 댓글 (대댓글 포함)
    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostIdOrderByCreatedAtAsc(@Param("postId") Long postId);
}
