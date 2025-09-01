package com.tripmate.repository;

import com.tripmate.entity.TripItem;
import com.tripmate.entity.TripDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TripItemRepository extends JpaRepository<TripItem, Long> {

    // TripDay별 아이템 조회 (순서대로)
    List<TripItem> findByTripDayOrderBySortOrderAsc(TripDay tripDay);
    
    // TripDay별 아이템 수
    long countByTripDay(TripDay tripDay);
    
    @Modifying
    @Transactional
    @Query("delete from TripItem t where t.tripDay = :tripDay")
    void deleteByTripDay(@Param("tripDay") TripDay tripDay);
}
