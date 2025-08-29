package com.tripmate.controller;

import com.tripmate.dto.DayOptimizeRequest;
import com.tripmate.dto.DayOptimizeResponse;
import com.tripmate.entity.TripItem;
import com.tripmate.repository.TripItemRepository;
import com.tripmate.service.DayOptimizeService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/optimize")
public class OptimizeController {
    private final DayOptimizeService service;
    private final TripItemRepository itemRepo;

    @PostMapping("/day")
    public DayOptimizeResponse day(@RequestBody DayOptimizeRequest req) {
        return service.optimize(req);
    }

    @PostMapping("/day/apply")
    @Transactional
    public void apply(@RequestParam Long tripId,
                      @RequestParam Integer dayIndex,
                      @RequestBody List<Long> orderedItemIds) {
        Map<Long, TripItem> map = itemRepo.findAllById(orderedItemIds).stream()
                .filter(x -> Objects.equals(x.getTrip().getId(), tripId) && Objects.equals(x.getDayIndex(), dayIndex))
                .collect(Collectors.toMap(TripItem::getId, x -> x));
        int order = 1;
        for (Long id : orderedItemIds) {
            TripItem it = map.get(id);
            if (it != null) it.setSortOrder(order++);
        }
        itemRepo.saveAll(map.values());
    }
}
