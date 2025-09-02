package com.tripmate.repository;

import com.tripmate.entity.Follow;
import com.tripmate.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    
    // 특정 사용자를 팔로우하고 있는지 확인
    Optional<Follow> findByFollowerAndFollowing(Member follower, Member following);
    
    // 팔로우 관계 존재 여부 확인
    boolean existsByFollowerAndFollowing(Member follower, Member following);
    
    // 팔로워 수 조회
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.following = :member")
    long countByFollowing(@Param("member") Member member);
    
    // 팔로잉 수 조회
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.follower = :member")
    long countByFollower(@Param("member") Member member);
    
    // 팔로우 관계 삭제
    void deleteByFollowerAndFollowing(Member follower, Member following);
}
