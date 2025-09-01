package com.tripmate.controller;

import com.tripmate.dto.DayOptimizeRequest;
import com.tripmate.dto.DayOptimizeResponse;
import com.tripmate.service.DayOptimizeService;
import com.tripmate.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/optimize")
public class OptimizeController {
    private final DayOptimizeService service;
    private final TripService tripService;

    @PostMapping("/day")
    public DayOptimizeResponse day(@RequestBody DayOptimizeRequest req) {
        return service.optimize(req);
    }

    @PostMapping("/day/apply")
    public void apply(@RequestParam Long tripId,
                      @RequestParam Integer dayIndex,
                      @RequestBody List<Long> orderedItemIds) {
        tripService.reorderTripItemsForDay(tripId, dayIndex, orderedItemIds);
    }
}
