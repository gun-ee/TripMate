
package com.tripmate.service;
import com.tripmate.dto.PlaceDto;
import lombok.RequiredArgsConstructor; import org.springframework.beans.factory.annotation.Value; import org.springframework.http.*; import org.springframework.stereotype.Service; import org.springframework.web.client.RestTemplate; import java.util.*;
@Service @RequiredArgsConstructor
public class PlaceSearchService {
  private final RestTemplate rest;
  @Value("${app.kakao.rest-key}") String kakaoKey;
  @Value("${app.otm.api-key}") String otmKey;
  @Value("${app.otm-default-rate:1}") int otmDefaultRate;
  public Optional<double[]> geocodeCity(String city) {
    String url = "https://dapi.kakao.com/v2/local/search/keyword.json?query={q}&size=1";
    HttpHeaders h = new HttpHeaders(); h.set("Authorization", "KakaoAK " + kakaoKey);
    ResponseEntity<Map> r = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(h), Map.class, city);
    List<Map<String,Object>> docs = (List<Map<String,Object>>) r.getBody().getOrDefault("documents", List.of());
    if (docs.isEmpty()) return Optional.empty();
    var d = docs.get(0);
    return Optional.of(new double[]{ Double.parseDouble((String)d.get("y")), Double.parseDouble((String)d.get("x")) });
  }
  public List<PlaceDto> search(String q, double lat, double lon, int limit, Integer rateOpt) {
    int rate = (rateOpt != null ? rateOpt : otmDefaultRate);
    List<PlaceDto> kakao = (q==null||q.isBlank())? List.of() : kakaoKeyword(q, lat, lon, limit);
    List<PlaceDto> otm   = otmNearby(lat, lon, limit, rate);
    return mergeRank(kakao, otm, lat, lon);
  }
  public List<PlaceDto> nearby(double lat, double lon, int limit, Integer rateOpt) { return search("", lat, lon, limit, rateOpt); }
  private List<PlaceDto> kakaoKeyword(String q, double lat, double lon, int size) {
    String url = "https://dapi.kakao.com/v2/local/search/keyword.json?query={q}&y={lat}&x={lon}&radius=20000&size={size}";
    HttpHeaders h = new HttpHeaders(); h.set("Authorization", "KakaoAK " + kakaoKey);
    ResponseEntity<Map> r = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(h), Map.class, Map.of("q", q, "lat", lat, "lon", lon, "size", Math.min(size,45)));
    List<Map<String,Object>> docs = (List<Map<String,Object>>) r.getBody().getOrDefault("documents", List.of());
    List<PlaceDto> out = new ArrayList<>();
    for (var d : docs) {
      out.add(PlaceDto.builder().source("kakao").ref((String)d.get("id")).name((String)d.get("place_name"))
        .lat(parseD((String)d.get("y"))).lng(parseD((String)d.get("x")))
        .address((String) java.util.Optional.ofNullable(d.get("road_address_name")).orElse(d.get("address_name")))
        .category((String)d.get("category_group_name")).photo(null).raw(d).build());
    }
    return out;
  }
  private List<PlaceDto> otmNearby(double lat, double lon, int limit, int rate) {
    String url = "https://api.opentripmap.com/0.1/en/places/radius?lat={lat}&lon={lon}&radius=20000&kinds=interesting_places&limit={limit}&rate={rate}&apikey={key}";
    Map m = rest.getForObject(url, Map.class, lat, lon, limit, rate, otmKey);
    List<Map<String,Object>> feats = (List<Map<String,Object>>) m.getOrDefault("features", List.of());
    List<PlaceDto> out = new ArrayList<>();
    for (var f : feats) {
      Map<String,Object> props = (Map<String,Object>) f.get("properties");
      Map<String,Object> geom  = (Map<String,Object>) f.get("geometry");
      List<Number> c = (List<Number>) geom.getOrDefault("coordinates", List.of());
      out.add(PlaceDto.builder().source("otm").ref((String)props.get("xid")).name((String)props.getOrDefault("name",""))
        .lat(c.size()>1? c.get(1).doubleValue(): null).lng(c.size()>0? c.get(0).doubleValue(): null)
        .category((String)props.get("kinds")).raw(f).build());
    }
    return out;
  }
  private List<PlaceDto> mergeRank(List<PlaceDto> kakao, List<PlaceDto> otm, double lat, double lon) {
    List<PlaceDto> all = new ArrayList<>(); all.addAll(kakao); all.addAll(otm);
    double tol = 0.0005; List<PlaceDto> dedup = new ArrayList<>();
    for (PlaceDto p : all) {
      boolean dup = dedup.stream().anyMatch(x -> x.getName().equalsIgnoreCase(p.getName()) && x.getLat()!=null && p.getLat()!=null && Math.abs(x.getLat()-p.getLat())<tol && Math.abs(x.getLng()-p.getLng())<tol);
      if (!dup) dedup.add(p);
    }
    dedup.sort((a,b)->{
      double da = dist(lat,lon,a.getLat(),a.getLng()); double db = dist(lat,lon,b.getLat(),b.getLng());
      double wa = "kakao".equals(a.getSource()) ? 0.9 : 1.0; double wb = "kakao".equals(b.getSource()) ? 0.9 : 1.0;
      return Double.compare(wa*da, wb*db);
    });
    return dedup;
  }
  private double dist(Double a, Double b, Double c, Double d) { if (a==null||b==null||c==null||d==null) return 1e9; double dx=a-c, dy=b-d; return Math.sqrt(dx*dx+dy*dy); }
  private Double parseD(String s){ try{ return s==null?null:Double.parseDouble(s);}catch(Exception e){return null;}}
}
