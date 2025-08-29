
package com.tripmate.service;
import lombok.RequiredArgsConstructor; import org.springframework.beans.factory.annotation.Value; import org.springframework.stereotype.Service; import org.springframework.web.client.RestTemplate; import java.util.*; import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class RouteService {
  private final RestTemplate rest; @Value("${app.osrm.base-url}") String osrmBase;
  public Map<String,Object> routeLine(String profile, java.util.List<double[]> latLngs) {
    String joined = latLngs.stream().map(p -> String.format(java.util.Locale.US, "%.6f,%.6f", p[1], p[0])).collect(Collectors.joining(";"));
    String url = osrmBase + "/route/v1/{p}/" + joined + "?overview=full&geometries=geojson"; return rest.getForObject(url, Map.class, profile);
  }
  public double[][] table(String profile, java.util.List<double[]> latLngs) {
    String joined = latLngs.stream().map(p -> String.format(java.util.Locale.US, "%.6f,%.6f", p[1], p[0])).collect(Collectors.joining(";"));
    String url = osrmBase + "/table/v1/{p}/" + joined + "?annotations=duration";
    Map m = rest.getForObject(url, Map.class, profile);
    java.util.List<java.util.List<Number>> durations = (java.util.List<java.util.List<Number>>) m.getOrDefault("durations", java.util.List.of());
    int n = durations.size(); double[][] D = new double[n][n];
    for (int i=0;i<n;i++) for (int j=0;j<n;j++) { Number v = durations.get(i).get(j); D[i][j] = (v==null)? 1e9 : v.doubleValue(); }
    return D;
  }
}
