package com.tripmate.mypage;

import com.tripmate.mypage.dto.MyTripCardResponse;
import com.tripmate.entity.Member;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripItem;
import com.tripmate.entity.TripDay;
import jakarta.persistence.*;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class MyPageQueryRepository {

    @PersistenceContext
    private EntityManager em;

    // 내 여행 전체 개수
    public long countTripsByMember(Member me) {
        return em.createQuery("SELECT COUNT(t) FROM Trip t WHERE t.member = :m", Long.class)
                .setParameter("m", me)
                .getSingleResult();
    }

    // 내 전체 방문지 개수
    public long countPlacesByMember(Member me) {
        return em.createQuery("""
                SELECT COUNT(ti)
                FROM TripItem ti
                JOIN ti.tripDay td
                JOIN td.trip t
                WHERE t.member = :m
                """, Long.class)
                .setParameter("m", me)
                .getSingleResult();
    }

    // 오늘 이후 시작 여행 수
    public long countUpcomingTrips(Member me) {
        return em.createQuery("""
                SELECT COUNT(t)
                FROM Trip t
                WHERE t.member = :m AND t.startDate >= CURRENT_DATE
                """, Long.class)
                .setParameter("m", me)
                .getSingleResult();
    }

    // 커서 기반: id 내림차순, cursorId 미만
    public List<Trip> findMyTrips(Member me, Long cursorId, int sizePlusOne) {
        String jpql = """
            SELECT t FROM Trip t
            WHERE t.member = :m
              AND (:cursorId IS NULL OR t.id < :cursorId)
            ORDER BY t.id DESC
        """;
        return em.createQuery(jpql, Trip.class)
                 .setParameter("m", me)
                 .setParameter("cursorId", cursorId)
                 .setMaxResults(sizePlusOne)
                 .getResultList();
    }

    // 특정 trips의 placeCount 집계
    public Map<Long, Integer> countItemsByTrips(List<Trip> trips) {
        if (trips.isEmpty()) return Map.of();
        List<Object[]> rows = em.createQuery("""
            SELECT td.trip.id, COUNT(ti)
            FROM TripItem ti
            JOIN ti.tripDay td
            WHERE td.trip IN :trips
            GROUP BY td.trip.id
        """, Object[].class).setParameter("trips", trips).getResultList();

        return rows.stream().collect(Collectors.toMap(
                r -> ((Number) r[0]).longValue(),
                r -> ((Number) r[1]).intValue()
        ));
    }
}
