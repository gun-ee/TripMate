package com.tripmate.service;

import com.tripmate.dto.CreateTripRequest;
import com.tripmate.dto.TripItemSaveDto;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripItem;
import com.tripmate.repository.TripItemRepository;
import com.tripmate.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepo;
    private final TripItemRepository itemRepo;

    @Transactional
    public Trip createTrip(CreateTripRequest r) {
        Trip t = Trip.builder()
                .title(r.getTitle())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .city(r.getCity())
                .cityLat(r.getCityLat())
                .cityLng(r.getCityLng())
                .build();
        return tripRepo.save(t);
    }

    @Transactional(readOnly = true)
    public List<TripItem> getItems(Long tripId) {
        return itemRepo.findByTripIdOrderByDayIndexAscSortOrderAsc(tripId);
    }

    @Transactional
    public void replaceItems(Long tripId, List<TripItemSaveDto> items) {
        Trip trip = tripRepo.findById(tripId).orElseThrow();
        itemRepo.deleteByTripId(tripId);

        int fallback = 1;
        for (TripItemSaveDto d : items) {
            TripItem it = TripItem.builder()
                    .trip(trip)
                    .dayIndex(d.getDayIndex())
                    .sortOrder(d.getSortOrder() != null ? d.getSortOrder() : fallback++)
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
    }
}
