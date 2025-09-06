package com.tripmate.repository;

import com.tripmate.entity.AccompanyComment;
import com.tripmate.entity.AccompanyPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccompanyCommentRepository extends JpaRepository<AccompanyComment, Long> {
    
    // 특정 게시글의 댓글 목록 조회 (삭제되지 않은 것만, 최신순)
    @Query("SELECT c FROM AccompanyComment c " +
           "JOIN FETCH c.author " +
           "WHERE c.post.id = :postId AND c.isDeleted = false " +
           "ORDER BY c.createdAt ASC")
    List<AccompanyComment> findByPostIdOrderByCreatedAtAsc(@Param("postId") Long postId);
    
    // 특정 게시글의 댓글 수 조회 (삭제되지 않은 것만)
    @Query("SELECT COUNT(c) FROM AccompanyComment c WHERE c.post.id = :postId AND c.isDeleted = false")
    long countByPostIdAndIsDeletedFalse(@Param("postId") Long postId);
    
    // 특정 댓글의 작성자인지 확인
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM AccompanyComment c " +
           "WHERE c.id = :commentId AND c.author.id = :authorId")
    boolean existsByIdAndAuthorId(@Param("commentId") Long commentId, @Param("authorId") Long authorId);
    
    // 여러 게시글의 댓글 수 조회 (삭제되지 않은 것만)
    @Query("SELECT c.post.id, COUNT(c) FROM AccompanyComment c " +
           "WHERE c.post.id IN :postIds AND c.isDeleted = false " +
           "GROUP BY c.post.id")
    List<Object[]> countCommentsByPostIds(@Param("postIds") List<Long> postIds);
}
