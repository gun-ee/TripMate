package com.tripmate.repository;

import com.tripmate.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    // 특정 게시글의 특정 사용자 좋아요 조회
    Optional<PostLike> findByPostIdAndMemberId(Long postId, Long memberId);
    
    // 특정 게시글의 좋아요 수
    long countByPostId(Long postId);
    
    // 특정 사용자가 좋아요한 게시글 ID 목록
    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.member.id = :memberId")
    List<Long> findPostIdsByMemberId(@Param("memberId") Long memberId);
    
    // 특정 게시글의 좋아요 존재 여부
    boolean existsByPostIdAndMemberId(Long postId, Long memberId);
    
    // 특정 게시글의 특정 사용자 좋아요 삭제
    @Modifying
    @Query("DELETE FROM PostLike pl WHERE pl.post.id = :postId AND pl.member.id = :memberId")
    void deleteByPostIdAndMemberId(@Param("postId") Long postId, @Param("memberId") Long memberId);
}
