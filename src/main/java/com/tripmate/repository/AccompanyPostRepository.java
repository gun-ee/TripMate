package com.tripmate.repository;

import com.tripmate.entity.AccompanyPost;
import com.tripmate.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccompanyPostRepository extends JpaRepository<AccompanyPost, Long> {
    // 키워드 검색 (제목 또는 작성자명)
    @Query("SELECT p FROM AccompanyPost p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.author.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<AccompanyPost> findByKeywordAndStatus(@Param("keyword") String keyword, 
                                               @Param("status") AccompanyPost.Status status, 
                                               Pageable pageable);
    
    // 상태별 조회 (null이면 모든 상태)
    @Query("SELECT p FROM AccompanyPost p WHERE (:status IS NULL OR p.status = :status)")
    Page<AccompanyPost> findByStatusWithNull(@Param("status") AccompanyPost.Status status, Pageable pageable);
    
    // 작성자별 조회
    Page<AccompanyPost> findByAuthor(Member author, Pageable pageable);
    
    // 작성자 ID로 조회 (최신순)
    @Query("SELECT p FROM AccompanyPost p WHERE p.author.id = :authorId ORDER BY p.createdAt DESC")
    List<AccompanyPost> findByAuthorIdOrderByCreatedAtDesc(@Param("authorId") Long authorId);
}
