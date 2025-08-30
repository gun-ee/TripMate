
package com.tripmate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripmate.dto.PlaceDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceSearchService {
  private final RestTemplate rest;
  private final StringRedisTemplate redis;
  private final ObjectMapper om = new ObjectMapper();

  @Value("${app.kakao.rest-key}") String kakaoKey;
  @Value("${app.otm.api-key}") String otmKey;
  @Value("${app.otm-default-rate:1}") int otmDefaultRate;

  // ---- Caching config ----
  private static final String V = "v1";
  private static final double GRID_DEG = 0.02; // ~= 2.2km 타일
  private static final long L1_TTL_MS = 45_000; // 45s
  private static final Duration TTL_KAKAO = Duration.ofMinutes(15);
  private static final Duration TTL_OTM   = Duration.ofMinutes(60);
  private static final Duration TTL_MERGED= Duration.ofMinutes(10);
  private static final Duration TTL_GEOCODE= Duration.ofDays(7);

  private static class Entry<T> { final T v; final long exp; Entry(T v,long exp){this.v=v;this.exp=exp;} }
  private final Map<String, Entry<List<PlaceDto>>> l1 = new ConcurrentHashMap<>();

  private String normQuery(String q){
    if (q==null) return "nearby";
    String t = q.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+"," ");
    return t.isEmpty()? "nearby" : t;
  }
  private String regionKey(double lat, double lon){
    int glat = (int)Math.floor(lat / GRID_DEG);
    int glon = (int)Math.floor(lon / GRID_DEG);
    return "z13:lat"+glat+":lon"+glon;
  }
  private String keyKakao(String q,double lat,double lon){
    return String.format("places:%s:region:%s:kakao:q=%s", V, regionKey(lat,lon), normQuery(q));
  }
  private String keyOtm(double lat,double lon){
    return String.format("places:%s:region:%s:otm:nearby", V, regionKey(lat,lon));
  }
  private String keyMerged(String q,double lat,double lon){
    return String.format("places:%s:region:%s:merged:q=%s", V, regionKey(lat,lon), normQuery(q));
  }
  private String keyGeocode(String city){
    String t = normQuery(city);
    return String.format("places:%s:geocode:q=%s", V, t);
  }
  private String lockKey(String cacheKey){ return "lock:" + cacheKey; }
  private List<PlaceDto> getL1(String k){
    Entry<List<PlaceDto>> e = l1.get(k); if (e==null) return null; if (e.exp < System.currentTimeMillis()){ l1.remove(k); return null;} return e.v;
  }
  private void putL1(String k,List<PlaceDto> v){ l1.put(k, new Entry<>(v, System.currentTimeMillis()+L1_TTL_MS)); }
  private List<PlaceDto> getL2(String k){
    try{
      String s = redis.opsForValue().get(k);
      if (s==null) { log.info("REDIS L2 MISS key={}", k); return null; }
      List<PlaceDto> v = om.readValue(s, new TypeReference<List<PlaceDto>>(){});
      log.info("REDIS L2 HIT key={} size={}", k, v!=null? v.size(): -1);
      return v;
    }catch(Exception e){ log.warn("REDIS L2 ERROR get key={} msg={}", k, e.getMessage()); return null; }
  }
  private void putL2(String k, List<PlaceDto> v, Duration ttl){
    try{ redis.opsForValue().set(k, om.writeValueAsString(v), ttl); log.info("REDIS L2 SET key={} ttl={}s size={}", k, ttl.getSeconds(), v!=null? v.size(): -1);}catch(Exception e){ log.warn("REDIS L2 ERROR set key={} msg={}", k, e.getMessage()); }
  }

  public Optional<double[]> geocodeCity(String city) {
    String ck = keyGeocode(city);
    // L2 우선 (L1은 필요성 낮음)
    try {
      String s = redis.opsForValue().get(ck);
      if (s != null) {
        double[] xy = om.readValue(s, double[].class);
        return Optional.ofNullable(xy);
      }
    } catch (Exception ignored) {}

    String lk = lockKey(ck);
    if (!acquireLock(lk, Duration.ofSeconds(15))) {
      // 누군가 채우는 중: 최대 5초 대기 후 재확인
      List<PlaceDto> spin = spinWaitCache(() -> getL2List(ck), 100, 50);
      if (spin != null) {
        // not used for geocode; fallthrough to fetch
      }
    }
    try {
      String url = "https://dapi.kakao.com/v2/local/search/keyword.json?query={q}&size=1";
      HttpHeaders h = new HttpHeaders(); h.set("Authorization", "KakaoAK " + kakaoKey);
      ResponseEntity<Map> r = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(h), Map.class, city);
      List<Map<String,Object>> docs = (List<Map<String,Object>>) r.getBody().getOrDefault("documents", List.of());
      if (docs.isEmpty()) return Optional.empty();
      var d = docs.get(0);
      double[] xy = new double[]{ Double.parseDouble((String)d.get("y")), Double.parseDouble((String)d.get("x")) };
      try { redis.opsForValue().set(ck, om.writeValueAsString(xy), TTL_GEOCODE); } catch (Exception ignored) {}
      return Optional.of(xy);
    } finally {
      releaseLock(lk);
    }
  }

  public List<PlaceDto> search(String q, double lat, double lon, int limit, Integer rateOpt) {
    // Try merged cache first
    String mk = keyMerged(q, lat, lon);
    List<PlaceDto> merged = Optional.ofNullable(getL1(mk)).orElseGet(() -> getL2(mk));
    if (merged != null) return merged;

    // Prevent stampede on merged build
    String lk = lockKey(mk);
    if (!acquireLock(lk, Duration.ofSeconds(15))) {
      // someone else is building; wait up to 3s
      List<PlaceDto> waited = spinWaitCache(() -> getL2(mk), 60, 50);
      if (waited != null) return waited;
    }

    int rate = (rateOpt != null ? rateOpt : otmDefaultRate);
    List<PlaceDto> kakao = (q==null||q.isBlank())? List.of() : kakaoKeyword(q, lat, lon, limit);
    List<PlaceDto> otm   = otmNearby(lat, lon, limit, rate);
    List<PlaceDto> out = mergeRank(kakao, otm, lat, lon);
    putL1(mk, out); putL2(mk, out, TTL_MERGED);
    releaseLock(lk);
    return out;
  }

  public List<PlaceDto> nearby(double lat, double lon, int limit, Integer rateOpt) { return search("", lat, lon, limit, rateOpt); }

  private List<PlaceDto> kakaoKeyword(String q, double lat, double lon, int size) {
    String kk = keyKakao(q, lat, lon);
    List<PlaceDto> cached = Optional.ofNullable(getL1(kk)).orElseGet(() -> getL2(kk));
    if (cached != null) return cached;
    // lock to avoid duplicate remote fetches
    String lk = lockKey(kk);
    if (!acquireLock(lk, Duration.ofSeconds(15))) {
      List<PlaceDto> waited = spinWaitCache(() -> getL2(kk), 60, 50);
      if (waited != null) return waited;
    }
    log.info("REMOTE FETCH kakao q={} lat={} lon={}", q, lat, lon);
    List<PlaceDto> out = kakaoFetchKeyword(q, lat, lon, size);
    putL1(kk, out); putL2(kk, out, TTL_KAKAO);
    releaseLock(lk);
    return out;
  }

  private List<PlaceDto> otmNearby(double lat, double lon, int limit, int rate) {
    String ok = keyOtm(lat, lon);
    List<PlaceDto> cached = Optional.ofNullable(getL1(ok)).orElseGet(() -> getL2(ok));
    if (cached != null) return cached;
    String lk = lockKey(ok);
    if (!acquireLock(lk, Duration.ofSeconds(15))) {
      List<PlaceDto> waited = spinWaitCache(() -> getL2(ok), 60, 50);
      if (waited != null) return waited;
    }
    log.info("REMOTE FETCH otm lat={} lon={} limit={} rate={}", lat, lon, limit, rate);
    List<PlaceDto> out = otmFetchNearby(lat, lon, limit, rate);
    putL1(ok, out); putL2(ok, out, TTL_OTM);
    releaseLock(lk);
    return out;
  }

  // ---- Lock helpers & small utils ----
  private boolean acquireLock(String lockKey, Duration ttl){
    try { Boolean ok = redis.opsForValue().setIfAbsent(lockKey, "1", ttl); log.info("REDIS LOCK {} {}", lockKey, Boolean.TRUE.equals(ok)?"acquired":"busy"); return Boolean.TRUE.equals(ok);} catch(Exception e){ log.warn("REDIS LOCK ERROR key={} msg={}", lockKey, e.getMessage()); return false; }
  }
  private void releaseLock(String lockKey){ try{ redis.delete(lockKey); log.info("REDIS UNLOCK {}", lockKey);}catch(Exception e){ log.warn("REDIS UNLOCK ERROR key={} msg={}", lockKey, e.getMessage()); } }
  private interface SupplierEx<T>{ T get(); }
  private List<PlaceDto> spinWaitCache(SupplierEx<List<PlaceDto>> supplier, int attempts, long sleepMs){
    for (int i=0;i<attempts;i++){
      List<PlaceDto> v = supplier.get(); if (v!=null) return v;
      try { Thread.sleep(sleepMs);} catch (InterruptedException ignored) {}
    }
    return null;
  }
  private List<PlaceDto> getL2List(String key){ return getL2(key); }

  // ---- Remote fetchers ----
  private List<PlaceDto> kakaoFetchKeyword(String q, double lat, double lon, int size) {
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

  private List<PlaceDto> otmFetchNearby(double lat, double lon, int limit, int rate) {
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
