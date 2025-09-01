package com.tripmate.controller;

import com.tripmate.dto.BulkSaveRequest;
import com.tripmate.dto.CreateTripRequest;
import com.tripmate.entity.Trip;
import com.tripmate.dto.TripEditView;
import com.tripmate.entity.TripDay;
import com.tripmate.entity.TripItem;
import com.tripmate.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import com.tripmate.entity.Member;
import com.tripmate.config.CustomUserDetails;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/trips")
public class TripController {
    private final TripService svc;

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateTripRequest req) {
        // SecurityContext에서 직접 인증 정보 가져오기
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        Member member = userDetails.getMember(); // Member 객체 가져오기
        Trip t = svc.createTrip(req, member);
        return Map.of("id", t.getId(), "title", t.getTitle());
    }

    @GetMapping
    public List<Trip> list() {
        // SecurityContext에서 직접 인증 정보 가져오기
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        Member member = userDetails.getMember(); // Member 객체 가져오기
        return svc.findByMember(member);
    }

    @GetMapping("/{tripId}/days")
    public List<TripDay> getTripDays(@PathVariable Long tripId) {
        return svc.getTripDays(tripId);
    }
    
    @GetMapping("/{tripId}/items")
    public List<TripItem> getTripItems(@PathVariable Long tripId) {
        return svc.getTripItems(tripId);
    }
    
    /**
     * 기존 API 호환성을 위한 엔드포인트
     */
    @GetMapping("/{tripId}/items/legacy")
    public List<TripItem> getItems(@PathVariable Long tripId) {
        return svc.getItems(tripId);
    }

    @PostMapping("/{tripId}/items/bulk")
    public void bulk(@PathVariable Long tripId, @RequestBody BulkSaveRequest req) {
        svc.replaceItems(tripId, req.getItems());
    }

    // 편집 초기화용 단일 조회
    @GetMapping("/{id}/edit-view")
    public TripEditView getEditView(@PathVariable Long id) {
        return svc.getEditView(id);
    }

    // 일자 시간 변경(부분 저장) 및 레그 재계산
    @PutMapping("/{tripId}/days/{dayIndex}")
    public void updateDay(
            @PathVariable Long tripId,
            @PathVariable Integer dayIndex,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        svc.updateDayTimeAndRecalc(tripId, dayIndex, startTime, endTime);
    }

    // 레그 재계산(강제)
    @PostMapping("/{tripId}/days/{dayIndex}/recalc")
    public void recalc(@PathVariable Long tripId, @PathVariable Integer dayIndex) {
        svc.recalcLegsForDay(tripId, dayIndex);
    }

    // Trip 타임존 변경
    @PutMapping("/{tripId}/timezone")
    public void updateTimezone(@PathVariable Long tripId, @RequestParam String tz) {
        svc.updateTimeZone(tripId, tz);
    }

    // 장소(아이템) 체류시간(min) 수정
    @PutMapping("/items/{itemId}/stay")
    public void updateItemStay(@PathVariable Long itemId, @RequestParam Integer min) {
        svc.updateItemStayMin(itemId, min);
    }
}
