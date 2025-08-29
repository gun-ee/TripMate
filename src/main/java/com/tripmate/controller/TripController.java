package com.tripmate.controller;

import com.tripmate.dto.BulkSaveRequest;
import com.tripmate.dto.CreateTripRequest;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripItem;
import com.tripmate.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/trips")
public class TripController {
    private final TripService svc;

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateTripRequest req) {
        Trip t = svc.createTrip(req);
        return Map.of("id", t.getId(), "title", t.getTitle());
    }

    @GetMapping("/{tripId}/items")
    public List<TripItem> list(@PathVariable Long tripId) {
        return svc.getItems(tripId);
    }

    @PostMapping("/{tripId}/items/bulk")
    public void bulk(@PathVariable Long tripId, @RequestBody BulkSaveRequest req) {
        svc.replaceItems(tripId, req.getItems());
    }
}
