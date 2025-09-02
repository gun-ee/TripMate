package com.tripmate.repository;

import com.tripmate.entity.TripDay;
import com.tripmate.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    
    // 여행별 일자 목록 조회 (일자 순서대로)
    List<TripDay> findByTripOrderByDayIndexAsc(Trip trip);
    
    // 여행과 일자 인덱스로 조회
    Optional<TripDay> findByTripAndDayIndex(Trip trip, Integer dayIndex);
    
    // 특정 날짜의 일정 조회
    @Query("SELECT td FROM TripDay td WHERE td.trip = :trip AND td.date = :date")
    Optional<TripDay> findByTripAndDate(@Param("trip") Trip trip, @Param("date") LocalDate date);
    
    // 여행별 일자 수
    long countByTrip(Trip trip);
    
    // 일자별 삭제
    @Modifying
    @Transactional
    @Query("delete from TripDay t where t.trip = :trip")
    void deleteByTrip(@Param("trip") Trip trip);
}
