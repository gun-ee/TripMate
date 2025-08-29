package com.tripmate.controller;

import com.tripmate.dto.PlaceDto;          // ← PlaceDto가 dto에 있다면 이대로,
import com.tripmate.service.PlaceSearchService; //  places 패키지라면 import 경로만 바꾸세요.
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places")
public class PlaceController {

  private final PlaceSearchService svc;

  @GetMapping("/geocodeCity")
  public Map<String,Object> geocode(@RequestParam String q) {
    return svc.geocodeCity(q)
            // ★ 여기! Map.<String,Object>of(...) 로 명시
            .map(xy -> Map.<String,Object>of("lat", xy[0], "lng", xy[1]))
            .orElseGet(() -> Map.<String,Object>of("lat", 37.5665, "lng", 126.9780));
  }

  @GetMapping("/search")
  public List<PlaceDto> search(@RequestParam String q,
                               @RequestParam double lat,
                               @RequestParam double lon,
                               @RequestParam(defaultValue = "30") int limit,
                               @RequestParam(required = false) Integer rate) {
    return svc.search(q, lat, lon, limit, rate);
  }

  @GetMapping("/nearby")
  public List<PlaceDto> nearby(@RequestParam double lat,
                               @RequestParam double lon,
                               @RequestParam(defaultValue = "30") int limit,
                               @RequestParam(required = false) Integer rate) {
    return svc.nearby(lat, lon, limit, rate);
  }
}
