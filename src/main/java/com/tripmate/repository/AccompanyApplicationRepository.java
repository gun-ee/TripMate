package com.tripmate.repository;

import com.tripmate.entity.AccompanyApplication;
import com.tripmate.entity.AccompanyPost;
import com.tripmate.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface AccompanyApplicationRepository extends JpaRepository<AccompanyApplication, Long> {
    
    // 특정 게시글의 신청자 목록 조회
    @Query("SELECT a FROM AccompanyApplication a " +
           "JOIN FETCH a.applicant " +
           "WHERE a.post.id = :postId " +
           "ORDER BY a.createdAt DESC")
    List<AccompanyApplication> findByPostIdWithApplicant(@Param("postId") Long postId);
    
    // 특정 게시글의 신청자 수 조회
    @Query("SELECT COUNT(a) FROM AccompanyApplication a WHERE a.post.id = :postId")
    long countByPostId(@Param("postId") Long postId);
    
    // 사용자가 작성한 게시글들의 신청자 수 조회
    @Query("SELECT a.post.id, COUNT(a) FROM AccompanyApplication a " +
           "WHERE a.post.author.id = :authorId " +
           "GROUP BY a.post.id")
    List<Object[]> countApplicationsByAuthorPosts(@Param("authorId") Long authorId);
    
    // 특정 게시글과 신청자로 중복 신청 확인
    boolean existsByPostAndApplicant(AccompanyPost post, Member applicant);
    
    // 여러 게시글의 신청자 목록 조회
    List<AccompanyApplication> findByPostIn(List<AccompanyPost> posts);
    
    // 특정 게시글의 신청자 목록 조회
    List<AccompanyApplication> findByPost(AccompanyPost post);
    
    // 특정 게시글의 신청자 목록 조회 (ID로)
    List<AccompanyApplication> findByPostId(Long postId);
    
    // 여러 게시글 ID의 신청자 수 조회
    @Query("SELECT a.post.id, COUNT(a) FROM AccompanyApplication a " +
           "WHERE a.post.id IN :postIds " +
           "GROUP BY a.post.id")
    List<Object[]> countApplicationsByPostIds(@Param("postIds") List<Long> postIds);
}