package com.tripmate.repository;

import com.tripmate.entity.TripItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TripItemRepository extends JpaRepository<TripItem, Long> {

    @Query("select t from TripItem t where t.trip.id = :tripId order by t.dayIndex asc, t.sortOrder asc")
    List<TripItem> findByTripIdOrderByDayIndexAscSortOrderAsc(@Param("tripId") Long tripId);

    @Modifying
    @Transactional
    @Query("delete from TripItem t where t.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}
