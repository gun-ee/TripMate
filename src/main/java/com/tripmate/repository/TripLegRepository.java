package com.tripmate.repository;

import com.tripmate.entity.TripLeg;
import com.tripmate.entity.TripDay;
import com.tripmate.entity.TripItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripLegRepository extends JpaRepository<TripLeg, Long> {
    
    // 일자별 이동 구간 목록 조회
    List<TripLeg> findByTripDayOrderByFromItemSortOrderAsc(TripDay tripDay);
    
    // 특정 아이템에서 출발하는 이동 구간 조회
    List<TripLeg> findByFromItem(TripItem fromItem);
    
    // 특정 아이템으로 도착하는 이동 구간 조회
    List<TripLeg> findByToItem(TripItem toItem);
    
    // 계산이 필요한 이동 구간 목록 조회
    @Query("SELECT tl FROM TripLeg tl WHERE tl.calcStatus = 'DIRTY'")
    List<TripLeg> findDirtyLegs();
    
    // 일자별 이동 구간 수
    long countByTripDay(TripDay tripDay);
    
    // 두 아이템 간의 이동 구간 조회
    Optional<TripLeg> findByFromItemAndToItem(TripItem fromItem, TripItem toItem);

    // 일자별 이동 구간 삭제
    @Modifying
    @Transactional
    @Query("delete from TripLeg t where t.tripDay = :tripDay")
    void deleteByTripDay(@Param("tripDay") TripDay tripDay);
}
