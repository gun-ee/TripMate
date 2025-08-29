
package com.tripmate.controller;
import com.tripmate.service.RouteService;
import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/api/route")
public class RouteController {
  private final RouteService route;
  @GetMapping public Map<String,Object> get(@RequestParam String mode, @RequestParam("orig") String orig, @RequestParam("dest") String dest) {
    String profile = switch ((mode==null? "WALK":mode).toUpperCase()) { case "CAR","DRIVE","DRIVING" -> "driving"; default -> "walking"; };
    String[] o = orig.split(",",2); String[] d = dest.split(",",2);
    double oLat = Double.parseDouble(o[0]), oLng = Double.parseDouble(o[1]);
    double dLat = Double.parseDouble(d[0]), dLng = Double.parseDouble(d[1]);
    java.util.List<double[]> pts = java.util.List.of(new double[]{oLat,oLng}, new double[]{dLat,dLng});
    return route.routeLine(profile, pts);
  }
}
