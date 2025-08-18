package com.tripmate.repository;

import com.tripmate.entity.RegionChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionChatMessageRepository extends JpaRepository<RegionChatMessage, Long> {
    
    // 특정 지역/도시의 메시지 조회 (최신순)
    @Query("SELECT m FROM RegionChatMessage m WHERE m.region = :region AND m.city = :city AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<RegionChatMessage> findByRegionAndCityOrderByCreatedAtDesc(
        @Param("region") String region, 
        @Param("city") String city, 
        Pageable pageable
    );
    
    // 특정 지역/도시의 최근 메시지 조회 (페이지네이션)
    @Query("SELECT m FROM RegionChatMessage m WHERE m.region = :region AND m.city = :city AND m.isDeleted = false AND m.id > :lastMessageId ORDER BY m.createdAt ASC")
    List<RegionChatMessage> findNewMessagesAfterId(
        @Param("region") String region, 
        @Param("city") String city, 
        @Param("lastMessageId") Long lastMessageId
    );
    
    // 특정 지역/도시의 메시지 수 조회
    @Query("SELECT COUNT(m) FROM RegionChatMessage m WHERE m.region = :region AND m.city = :city AND m.isDeleted = false")
    long countByRegionAndCity(@Param("region") String region, @Param("city") String city);
}

