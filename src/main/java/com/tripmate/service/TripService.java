package com.tripmate.service;

import com.tripmate.dto.CreateTripRequest;
import com.tripmate.dto.CreateTripDayRequest;
import com.tripmate.dto.CreateTripItemRequest;
import com.tripmate.dto.TripItemSaveDto;
import com.tripmate.dto.TripEditView;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripDay;
import com.tripmate.entity.TripItem;
import com.tripmate.entity.TripLeg;
import com.tripmate.repository.TripDayRepository;
import com.tripmate.repository.TripItemRepository;
import com.tripmate.repository.TripLegRepository;
import com.tripmate.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.tripmate.entity.Member;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepo;
    private final TripDayRepository dayRepo;
    private final TripItemRepository itemRepo;
    private final TripLegRepository legRepo;
    private final RouteService routeService;

    @Transactional
    public Trip createTrip(CreateTripRequest r, Member member) {
        // 1. 여행 기본 정보 생성
        Trip trip = Trip.builder()
                .title(r.getTitle())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .city(r.getCity())
                .cityLat(r.getCityLat())
                .cityLng(r.getCityLng())
                .member(member)
                .defaultStartTime(r.getDefaultStartTime())
                .defaultEndTime(r.getDefaultEndTime())
                .defaultTransportMode(r.getDefaultTransportMode())
                .timeZone("Asia/Seoul")
                .build();
        
        trip = tripRepo.save(trip);
        
        // 2. 일별 일정 생성
        if (r.getDays() != null && !r.getDays().isEmpty()) {
            createTripDays(trip, r.getDays());
        } else {
            // 기본 일별 일정 생성 (시작일부터 종료일까지)
            createDefaultTripDays(trip, r.getStartDate(), r.getEndDate());
        }
        
        return trip;
    }
    
    private void createTripDays(Trip trip, List<CreateTripDayRequest> dayRequests) {
        for (CreateTripDayRequest dayReq : dayRequests) {
            TripDay day = TripDay.builder()
                    .trip(trip)
                    .dayIndex(dayReq.getDayIndex())
                    .date(dayReq.getDate())
                    .startTime(dayReq.getStartTime())
                    .endTime(dayReq.getEndTime())
                    .build();
            
            day = dayRepo.save(day);
            
            // 일정 항목들 생성
            if (dayReq.getItems() != null && !dayReq.getItems().isEmpty()) {
                createTripItems(day, dayReq.getItems());
            } else {
                // 아이템이 없으면 기본 샘플 데이터 생성
                createSampleTripItems(day);
            }
            // 이동구간 계산
            calculateTripLegs(day);
        }
    }
    
    private void createDefaultTripDays(Trip trip, LocalDate startDate, LocalDate endDate) {
        int dayIndex = 1;
        LocalDate currentDate = startDate;
        
        while (!currentDate.isAfter(endDate)) {
            TripDay day = TripDay.builder()
                    .trip(trip)
                    .dayIndex(dayIndex++)
                    .date(currentDate)
                    .startTime(trip.getDefaultStartTime())
                    .endTime(trip.getDefaultEndTime())
                    .build();
            
            day = dayRepo.save(day);
            
            // 기본 TripItem 생성 (샘플 데이터)
            createSampleTripItems(day);
            
            currentDate = currentDate.plusDays(1);
        }
    }
    
    /**
     * 샘플 TripItem 생성 (테스트용)
     */
    private void createSampleTripItems(TripDay day) {
        // 샘플 장소 데이터
        String[] sampleNames = {"제주공항", "성산일출봉", "만장굴", "천지연폭포", "한라산"};
        double[][] sampleCoords = {
            {33.5063, 126.4928}, // 제주공항
            {33.4581, 126.9425}, // 성산일출봉
            {33.5283, 126.7650}, // 만장굴
            {33.2461, 126.5600}, // 천지연폭포
            {33.3617, 126.5292}  // 한라산
        };
        
        for (int i = 0; i < sampleNames.length; i++) {
            TripItem item = TripItem.builder()
                    .tripDay(day)
                    .sortOrder(i + 1)
                    .type("place")
                    .placeSource("custom")
                    .nameSnapshot(sampleNames[i])
                    .lat(sampleCoords[i][0])
                    .lng(sampleCoords[i][1])
                    .addrSnapshot("제주도")
                    .categorySnapshot("관광지")
                    .snapshot("{\"name\":\"" + sampleNames[i] + "\",\"type\":\"place\"}")
                    .stayMin(60)
                    .notes("샘플 장소")
                    .capturedAt(LocalDateTime.now())
                    .build();
            
            itemRepo.save(item);
        }
        
        // TripLeg 생성 (인접한 아이템들 간) 및 계산
        createTripLegs(day);
        calculateTripLegs(day);
    }
    
    private void createTripItems(TripDay day, List<CreateTripItemRequest> itemRequests) {
        for (CreateTripItemRequest itemReq : itemRequests) {
            TripItem item = TripItem.builder()
                    .tripDay(day)
                    .sortOrder(itemReq.getSortOrder())
                    .type(itemReq.getType() != null ? itemReq.getType() : "place")
                    .placeSource(itemReq.getPlaceSource())
                    .placeRef(itemReq.getPlaceRef())
                    .nameSnapshot(itemReq.getNameSnapshot())
                    .lat(itemReq.getLat())
                    .lng(itemReq.getLng())
                    .addrSnapshot(itemReq.getAddrSnapshot())
                    .categorySnapshot(itemReq.getCategorySnapshot())
                    .photoUrlSnapshot(itemReq.getPhotoUrlSnapshot())
                    .snapshot(itemReq.getSnapshot() != null ? itemReq.getSnapshot() : "{}")
                    .stayMin(itemReq.getStayMin() != null ? itemReq.getStayMin() : 60)
                    .notes(itemReq.getNotes())
                    .capturedAt(LocalDateTime.now())
                    .openTime(itemReq.getOpenTime())
                    .closeTime(itemReq.getCloseTime())
                    .build();
            
            itemRepo.save(item);
        }
        
        // 이동 구간 생성 (인접한 아이템들 간)
        createTripLegs(day);
    }
    
    private void createTripLegs(TripDay day) {
        List<TripItem> items = itemRepo.findByTripDayOrderBySortOrderAsc(day);
        
        // 아이템이 2개 이상일 때만 이동 구간 생성
        if (items.size() < 2) {
            return;
        }
        
        for (int i = 0; i < items.size() - 1; i++) {
            TripItem fromItem = items.get(i);
            TripItem toItem = items.get(i + 1);
            
            TripLeg leg = TripLeg.builder()
                    .tripDay(day)
                    .fromItem(fromItem)
                    .toItem(toItem)
                    .mode(day.getTrip().getDefaultTransportMode())
                    .calcStatus(TripLeg.CalcStatus.DIRTY)
                    .build();
            
            legRepo.save(leg);
        }
    }

    /**
     * 생성된 이동구간에 대해 OSRM을 호출하여 거리/시간/라인을 계산한다.
     */
    private void calculateTripLegs(TripDay day) {
        List<TripItem> items = itemRepo.findByTripDayOrderBySortOrderAsc(day);
        if (items.size() < 2) return;

        String profile;
        switch (day.getTrip().getDefaultTransportMode()) {
            case WALK -> profile = "walking";
            case TRANSIT -> profile = "driving"; // OSRM 미지원 → driving 폴백
            case CAR -> {
                profile = "driving";
            }
            default -> profile = "driving";
        }

        ObjectMapper om = new ObjectMapper();

        for (int i = 0; i < items.size() - 1; i++) {
            TripItem from = items.get(i);
            TripItem to = items.get(i + 1);

            TripLeg leg = legRepo.findByFromItemAndToItem(from, to).orElse(null);
            if (leg == null) continue;

            List<double[]> coords = java.util.List.of(
                new double[]{ from.getLat(), from.getLng() },
                new double[]{ to.getLat(), to.getLng() }
            );

            try {
                Map<String, Object> res = routeService.routeLine(profile, coords);
                List<Map<String, Object>> routes = (List<Map<String, Object>>) res.getOrDefault("routes", java.util.List.of());
                if (!routes.isEmpty()) {
                    Map<String, Object> r0 = routes.get(0);
                    Number dist = (Number) r0.getOrDefault("distance", 0);
                    Number dur = (Number) r0.getOrDefault("duration", 0);
                    Object geom = r0.get("geometry");

                    leg.setDistanceM(dist != null ? (int) Math.round(dist.doubleValue()) : null);
                    leg.setDurationSec(dur != null ? (int) Math.round(dur.doubleValue()) : null);
                    if (geom != null) {
                        try { leg.setRoutePolyline(om.writeValueAsString(geom)); } catch (Exception ignore) { leg.setRoutePolyline(null); }
                    }
                    leg.setCalcStatus(TripLeg.CalcStatus.OK);
                    leg.setCalcSource(TripLeg.CalcSource.OSRM);
                    leg.setCalcAt(LocalDateTime.now());
                    legRepo.save(leg);
                } else {
                    leg.setCalcStatus(TripLeg.CalcStatus.FAIL);
                    legRepo.save(leg);
                }
            } catch (Exception ex) {
                // 실패 시 폴백: 하버사인 거리 + 평균속도 30km/h
                double dKm = haversineKm(from.getLat(), from.getLng(), to.getLat(), to.getLng());
                int distM = (int) Math.round(dKm * 1000);
                int durSec = (int) Math.round((dKm / 30.0) * 3600);
                leg.setDistanceM(distM);
                leg.setDurationSec(durSec);
                leg.setCalcStatus(TripLeg.CalcStatus.FALLBACK);
                leg.setCalcSource(TripLeg.CalcSource.FALLBACK);
                leg.setCalcAt(LocalDateTime.now());
                legRepo.save(leg);
            }
        }
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    @Transactional(readOnly = true)
    public List<TripDay> getTripDays(Long tripId) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        return dayRepo.findByTripOrderByDayIndexAsc(trip);
    }
    
    @Transactional(readOnly = true)
    public List<TripItem> getTripItems(Long tripId) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        List<TripDay> days = dayRepo.findByTripOrderByDayIndexAsc(trip);
        List<TripItem> allItems = new ArrayList<>();
        
        for (TripDay day : days) {
            allItems.addAll(itemRepo.findByTripDayOrderBySortOrderAsc(day));
        }
        
        return allItems;
    }

    @Transactional(readOnly = true)
    public List<TripItem> getItems(Long tripId) {
        return getTripItems(tripId);
    }
    
    /**
     * 기존 API 호환성을 위한 메서드 (deprecated)
     * @deprecated getTripItems 사용 권장
     */
    @Deprecated
    @Transactional(readOnly = true)
    public List<TripItem> getItemsByTripId(Long tripId) {
        return getTripItems(tripId);
    }

    @Transactional
    public void replaceItems(Long tripId, List<TripItemSaveDto> items) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        
        // 기존 아이템들을 일자별로 그룹화
        Map<Integer, List<TripItemSaveDto>> itemsByDay = items.stream()
                .collect(Collectors.groupingBy(TripItemSaveDto::getDayIndex));
        
        // 각 일자별로 처리
        for (Map.Entry<Integer, List<TripItemSaveDto>> entry : itemsByDay.entrySet()) {
            Integer dayIndex = entry.getKey();
            List<TripItemSaveDto> dayItems = entry.getValue();
            
            // 해당 일자 찾기
            TripDay tripDay = dayRepo.findByTripAndDayIndex(trip, dayIndex)
                    .orElseThrow(() -> new RuntimeException("Day not found: " + dayIndex));
            
            // 기존 아이템 삭제
            itemRepo.deleteByTripDay(tripDay);
            
            // 새 아이템 생성
            int sortOrder = 1;
            for (TripItemSaveDto d : dayItems) {
            TripItem it = TripItem.builder()
                        .tripDay(tripDay)
                        .sortOrder(sortOrder++)
                    .type(d.getType() != null ? d.getType() : "place")
                    .placeSource(d.getPlaceSource())
                    .placeRef(d.getPlaceRef())
                    .nameSnapshot(d.getName())
                    .lat(d.getLat())
                    .lng(d.getLng())
                    .addrSnapshot(d.getAddress())
                    .categorySnapshot(d.getCategory())
                    .photoUrlSnapshot(d.getPhotoUrl())
                    .snapshot(d.getRawJson() != null ? d.getRawJson() : "{}")
                    .stayMin(d.getStayMin() != null ? d.getStayMin() : 60)
                    .notes(d.getNotes())
                    .capturedAt(LocalDateTime.now())
                    .openTime(d.getOpenTime())
                    .closeTime(d.getCloseTime())
                    .build();
            itemRepo.save(it);
        }
            
            // 이동 구간 재생성 + 계산
            legRepo.deleteByTripDay(tripDay);
            createTripLegs(tripDay);
            calculateTripLegs(tripDay);
        }
    }

    @Transactional
    public void updateDayTimeAndRecalc(Long tripId, Integer dayIndex, String start, String end) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        TripDay day = dayRepo.findByTripAndDayIndex(trip, dayIndex)
                .orElseThrow(() -> new IllegalArgumentException("TripDay not found"));
        try {
            day.setStartTime(java.time.LocalTime.parse(start));
            day.setEndTime(java.time.LocalTime.parse(end));
        } catch (Exception e) { throw new IllegalArgumentException("Invalid time format HH:mm"); }
        dayRepo.save(day);
        // 레그 재계산
        legRepo.deleteByTripDay(day);
        createTripLegs(day);
        calculateTripLegs(day);
    }

    @Transactional
    public void recalcLegsForDay(Long tripId, Integer dayIndex) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        TripDay day = dayRepo.findByTripAndDayIndex(trip, dayIndex)
                .orElseThrow(() -> new IllegalArgumentException("TripDay not found"));
        legRepo.deleteByTripDay(day);
        createTripLegs(day);
        calculateTripLegs(day);
    }

    @Transactional
    public void updateTimeZone(Long tripId, String tz) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        trip.setTimeZone(tz);
        tripRepo.save(trip);
    }

    @Transactional
    public void updateItemStayMin(Long itemId, Integer min) {
        TripItem item = itemRepo.findById(itemId).orElseThrow();
        item.setStayMin(min);
        itemRepo.save(item);
        // 해당 일차의 레그만 재계산(도착/출발 시각은 클라이언트 스케줄러에서 보임)
        TripDay day = item.getTripDay();
        legRepo.deleteByTripDay(day);
        createTripLegs(day);
        calculateTripLegs(day);
    }

    @Transactional(readOnly = true)
    public TripEditView getEditView(Long tripId) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        List<TripDay> days = dayRepo.findByTripOrderByDayIndexAsc(trip);

        List<TripEditView.Day> dayDtos = new ArrayList<>();
        for (TripDay d : days) {
            List<TripItem> items = itemRepo.findByTripDayOrderBySortOrderAsc(d);
            List<TripLeg> legs = legRepo.findByTripDayOrderByFromItemSortOrderAsc(d);

            List<TripEditView.Item> itemDtos = items.stream().map(it -> TripEditView.Item.builder()
                    .id(it.getId())
                    .sortOrder(it.getSortOrder())
                    .type(it.getType())
                    .placeSource(it.getPlaceSource())
                    .placeRef(it.getPlaceRef())
                    .nameSnapshot(it.getNameSnapshot())
                    .lat(it.getLat())
                    .lng(it.getLng())
                    .addrSnapshot(it.getAddrSnapshot())
                    .categorySnapshot(it.getCategorySnapshot())
                    .photoUrlSnapshot(it.getPhotoUrlSnapshot())
                    .snapshot(it.getSnapshot())
                    .stayMin(it.getStayMin())
                    .notes(it.getNotes())
                    .openTime(it.getOpenTime())
                    .closeTime(it.getCloseTime())
                    .build()).toList();

            List<TripEditView.Leg> legDtos = legs.stream().map(l -> TripEditView.Leg.builder()
                    .id(l.getId())
                    .fromItemId(l.getFromItem().getId())
                    .toItemId(l.getToItem().getId())
                    .distanceM(l.getDistanceM())
                    .durationSec(l.getDurationSec())
                    .routePolyline(l.getRoutePolyline())
                    .calcSource(l.getCalcSource() != null ? l.getCalcSource().name() : null)
                    .calcStatus(l.getCalcStatus() != null ? l.getCalcStatus().name() : null)
                    .calcAt(l.getCalcAt())
                    .build()).toList();

            dayDtos.add(TripEditView.Day.builder()
                    .id(d.getId())
                    .dayIndex(d.getDayIndex())
                    .date(d.getDate())
                    .startTime(d.getStartTime())
                    .endTime(d.getEndTime())
                    .items(itemDtos)
                    .legs(legDtos)
                    .build());
        }

        return TripEditView.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .city(trip.getCity())
                .cityLat(trip.getCityLat())
                .cityLng(trip.getCityLng())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .defaultStartTime(trip.getDefaultStartTime())
                .defaultEndTime(trip.getDefaultEndTime())
                .defaultTransportMode(trip.getDefaultTransportMode().name())
                .days(dayDtos)
                .build();
    }
    
    // Member별 여행 목록 조회
    @Transactional(readOnly = true)
    public List<Trip> findByMember(Member member) {
        return tripRepo.findByMember(member);
    }
    
    /**
     * 특정 일자의 여행 아이템 순서를 재정렬
     */
    @Transactional
    public void reorderTripItemsForDay(Long tripId, Integer dayIndex, List<Long> orderedItemIds) {
        Trip trip = tripRepo.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + tripId));
        
        TripDay tripDay = dayRepo.findByTripAndDayIndex(trip, dayIndex)
                .orElseThrow(() -> new IllegalArgumentException("TripDay not found for trip: " + tripId + ", day: " + dayIndex));
        
        // 해당 TripDay에 속하는 모든 TripItem을 가져와 Map으로 변환
        Map<Long, TripItem> itemMap = itemRepo.findByTripDayOrderBySortOrderAsc(tripDay)
                .stream()
                .collect(Collectors.toMap(TripItem::getId, item -> item));
        
        // 순서 재정렬
        int order = 1;
        for (Long itemId : orderedItemIds) {
            TripItem item = itemMap.get(itemId);
            if (item != null) {
                item.setSortOrder(order++);
            }
        }
        
        // 변경된 아이템들 저장
        itemRepo.saveAll(itemMap.values());
        
        // 이동 구간 재생성 (순서가 바뀌었으므로)
        createTripLegs(tripDay);
    }
}
