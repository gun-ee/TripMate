package com.tripmate.repository;

import com.tripmate.entity.Trip;
import com.tripmate.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    
    // Member별 여행 목록 조회
    List<Trip> findByMember(Member member);
    
    // Member별 여행 목록 조회 (생성일 역순)
    List<Trip> findByMemberOrderByCreatedAtDesc(Member member);
    
    // 여행 ID와 Member로 여행 조회 (소유자 확인용)
    Optional<Trip> findByIdAndMember(Long id, Member member);
    
    // Member별 여행 개수
    long countByMember(Member member);
    
    // 특정 도시의 여행 목록
    @Query("SELECT t FROM Trip t WHERE t.member = :member AND t.city = :city")
    List<Trip> findByMemberAndCity(@Param("member") Member member, @Param("city") String city);
}
