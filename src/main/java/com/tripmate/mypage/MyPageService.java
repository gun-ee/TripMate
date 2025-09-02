package com.tripmate.mypage;

import com.tripmate.mypage.dto.*;
import com.tripmate.entity.Member;
import com.tripmate.entity.Trip;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MyPageQueryRepository q;

    public MyProfileResponse loadProfile(Member me) {
        long tripCnt   = q.countTripsByMember(me);
        long placeCnt  = q.countPlacesByMember(me);
        long upcoming  = q.countUpcomingTrips(me);

        String name = me.getNickname();
        String username = (name != null && !name.isBlank())
                ? name
                : (me.getEmail() != null ? me.getEmail().split("@")[0] : "user");

        return MyProfileResponse.builder()
                .memberId(me.getId())
                .displayName(name)
                .username(username)
                .avatarUrl(me.getProfileImg())
                .tripCount(tripCnt)
                .totalPlaceCount(placeCnt)
                .upcomingTripCount(upcoming)
                .build();
    }

    public MyTripsPageResponse loadMyTrips(Member me, Long cursorId, int size) {
        int pageSize = Math.max(1, Math.min(size, 50));
        List<Trip> trips = q.findMyTrips(me, cursorId, pageSize + 1);

        boolean hasMore = trips.size() > pageSize;
        if (hasMore) trips = trips.subList(0, pageSize);

        Map<Long, Integer> placeCounts = q.countItemsByTrips(trips);

        List<MyTripCardResponse> items = trips.stream().map(t ->
                MyTripCardResponse.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .startDate(t.getStartDate())
                        .endDate(t.getEndDate())
                        .placeCount(placeCounts.getOrDefault(t.getId(), 0))
                        .coverImageUrl(null) // 프로젝트에 커버 필드 없다면 null 유지(프론트에서 플레이스홀더)
                        .isPublic(true)      // 공개여부 필드 없으면 true 고정
                        .build()
        ).toList();

        Long nextCursor = hasMore ? trips.get(trips.size() - 1).getId() : null;

        return MyTripsPageResponse.builder()
                .items(items)
                .nextCursorId(nextCursor)
                .build();
    }
}
