package com.tripmate.service;

import com.tripmate.dto.DayOptimizeRequest;
import com.tripmate.dto.DayOptimizeResponse;
import com.tripmate.service.RouteService; // RouteService를 다른 패키지로 옮기셨다면 여기 import만 맞춰주세요.
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DayOptimizeService {
  private final RouteService routeService;

  public DayOptimizeResponse optimize(DayOptimizeRequest req) {
    String profile = ("CAR".equalsIgnoreCase(req.getMode())) ? "driving" : "walking";
    LocalTime start = parseTimeDefault(req.getStartTime(), LocalTime.of(10, 0));
    LocalTime end   = parseTimeDefault(req.getEndTime(),   LocalTime.of(20, 0));

    List<DayOptimizeRequest.Stop> S = new ArrayList<>(req.getStops());
    if (S.size() < 2) {
      DayOptimizeResponse resp = new DayOptimizeResponse();
      resp.setOrder(S.stream().map(DayOptimizeRequest.Stop::getId).toList());
      resp.setGeometry(Map.of());
      return resp;
    }

    // 좌표 수집 + 기본 체류시간 보정
    List<double[]> pts = new ArrayList<>();
    for (DayOptimizeRequest.Stop s : S) {
      pts.add(new double[]{ s.getLat(), s.getLng() });
      if (s.getStayMin() == null) s.setStayMin(60);
    }

    double[][] D = routeService.table(profile, pts);

    List<Integer> route = initialNearestInsertion(S, D, req.getStartId(), req.getEndId());
    boolean[] lock = lockedMask(S, route, req.getStartId(), req.getEndId());
    twoOpt(route, D, lock);

    ScheduleResult sch = schedule(S, route, D, start, end);
    List<double[]> ordered = route.stream().map(pts::get).toList();
    Map<String, Object> osrm = routeService.routeLine(profile, ordered);

    DayOptimizeResponse resp = new DayOptimizeResponse();
    resp.setOrder(route.stream().map(i -> S.get(i).getId()).toList());

    List<DayOptimizeResponse.Leg> legs = new ArrayList<>();
    for (int k = 0; k < route.size(); k++) {
      DayOptimizeRequest.Stop st = S.get(route.get(k));
      DayOptimizeResponse.Leg leg = new DayOptimizeResponse.Leg();
      leg.setId(st.getId());
      leg.setArrive(fmt(sch.arrive[k]));
      leg.setDepart(fmt(sch.depart[k]));
      leg.setWaitMin(sch.wait[k]);
      legs.add(leg);
    }
    resp.setItinerary(legs);
    resp.setTotalTravelSec(sch.travelSec);
    resp.setTotalStayMin(Arrays.stream(sch.stay).sum());
    resp.setTotalWaitMin(Arrays.stream(sch.wait).sum());
    resp.setTimeWindowViolated(sch.violated);
    resp.setGeometry(extractGeometry(osrm));
    return resp;
  }

  // ---------- 스케줄링/휴리스틱 보조 로직 (모두 getter 사용) ----------
  private static class ScheduleResult {
    LocalTime[] arrive; LocalTime[] depart;
    int[] stay; int[] wait; boolean violated; double travelSec;
  }

  private ScheduleResult schedule(List<DayOptimizeRequest.Stop> S, List<Integer> r, double[][] D,
                                  LocalTime start, LocalTime end) {
    int n = r.size();
    ScheduleResult R = new ScheduleResult();
    R.arrive = new LocalTime[n]; R.depart = new LocalTime[n];
    R.stay = new int[n]; R.wait = new int[n];
    R.travelSec = 0; R.violated = false;

    LocalTime t = start;
    for (int k = 0; k < n; k++) {
      int from = r.get(Math.max(k - 1, 0)), to = r.get(k);
      if (k > 0) {
        int sec = (int) Math.round(D[from][to]);
        R.travelSec += sec;
        t = t.plusSeconds(sec);
      }
      DayOptimizeRequest.Stop s = S.get(to);
      LocalTime open  = parseTimeOrNull(s.getOpen());
      LocalTime close = parseTimeOrNull(s.getClose());
      LocalTime arrive = t;
      int wait = 0;
      if (open != null && arrive.isBefore(open)) {
        wait = (int) java.time.Duration.between(arrive, open).toMinutes();
        arrive = open;
      }
      LocalTime depart = arrive.plusMinutes(s.getStayMin());
      if ((close != null && depart.isAfter(close)) || depart.isAfter(end)) R.violated = true;

      R.arrive[k] = arrive; R.depart[k] = depart; R.wait[k] = wait; R.stay[k] = s.getStayMin();
      t = depart;
    }
    return R;
  }

  private List<Integer> initialNearestInsertion(List<DayOptimizeRequest.Stop> S, double[][] D,
                                                Long startId, Long endId) {
    int n = S.size();
    List<Integer> route = new ArrayList<>();
    Integer sIdx = indexOf(S, startId), eIdx = indexOf(S, endId);

    int seed = (sIdx != null) ? sIdx : 0;
    route.add(seed);
    int nn = nearestNeighbor(D, seed, n);
    if (nn >= 0 && nn != seed) route.add(nn);

    while (route.size() < n) {
      int bestP = -1, bestPos = -1; double best = 1e18;
      for (int p = 0; p < n; p++) {
        if (route.contains(p)) continue;
        for (int pos = 0; pos <= route.size(); pos++) {
          if (!canPlace(S, route, pos, p, sIdx, eIdx)) continue;
          double cost = insertionCost(D, route, pos, p);
          if (cost < best) { best = cost; bestP = p; bestPos = pos; }
        }
      }
      if (bestP == -1) { for (int p = 0; p < n; p++) if (!route.contains(p)) { route.add(p); break; } }
      else route.add(bestPos, bestP);
    }

    if (eIdx != null) { route.remove((Integer) eIdx); route.add(eIdx); }
    return route;
  }

  private boolean[] lockedMask(List<DayOptimizeRequest.Stop> S, List<Integer> r, Long startId, Long endId) {
    boolean[] lock = new boolean[r.size()];
    Integer s = indexOf(S, startId), e = indexOf(S, endId);
    if (s != null) lock[r.indexOf(s)] = true;
    if (e != null) lock[r.indexOf(e)] = true;
    for (int i = 0; i < r.size(); i++) if (S.get(r.get(i)).isLocked()) lock[i] = true;
    return lock;
  }

  private void twoOpt(List<Integer> r, double[][] D, boolean[] lock) {
    boolean improved = true;
    while (improved) {
      improved = false;
      for (int i = 1; i < r.size() - 2; i++) {
        if (lock[i]) continue;
        for (int k = i + 1; k < r.size() - 1; k++) {
          if (lock[k]) continue;
          double delta = -D[r.get(i - 1)][r.get(i)] - D[r.get(k)][r.get(k + 1)]
                  + D[r.get(i - 1)][r.get(k)] + D[r.get(i)][r.get(k + 1)];
          if (delta < -1e-6) { reverse(r, i, k); improved = true; }
        }
      }
    }
  }

  private Integer indexOf(List<DayOptimizeRequest.Stop> S, Long id) {
    if (id == null) return null;
    for (int i = 0; i < S.size(); i++) if (Objects.equals(S.get(i).getId(), id)) return i;
    return null;
  }
  private int nearestNeighbor(double[][] D, int from, int n) {
    double best = 1e18; int arg = -1;
    for (int i = 0; i < n; i++) if (i != from) { if (D[from][i] < best) { best = D[from][i]; arg = i; } }
    return arg;
  }
  private double insertionCost(double[][] D, List<Integer> r, int pos, int p) {
    if (r.isEmpty()) return 0;
    if (pos == 0) return D[p][r.get(0)];
    if (pos == r.size()) return D[r.get(r.size() - 1)][p];
    int a = r.get(pos - 1), b = r.get(pos);
    return D[a][p] + D[p][b] - D[a][b];
  }
  private boolean canPlace(List<DayOptimizeRequest.Stop> S, List<Integer> r, int pos, int p,
                           Integer sIdx, Integer eIdx) {
    if (sIdx != null && p == sIdx && pos != 0) return false;
    if (eIdx != null && p == eIdx && pos != r.size()) return false;
    return true;
  }
  private void reverse(List<Integer> r, int i, int k) { while (i < k) { int t = r.get(i); r.set(i, r.get(k)); r.set(k, t); i++; k--; } }

  private LocalTime parseTimeDefault(String s, LocalTime def){ try { return (s == null || s.isBlank()) ? def : LocalTime.parse(s); } catch (Exception e){ return def; } }
  private LocalTime parseTimeOrNull(String s){ try { return (s == null || s.isBlank()) ? null : LocalTime.parse(s); } catch (Exception e){ return null; } }
  private String fmt(LocalTime t){ return (t == null) ? null : t.toString(); }
  private Map<String,Object> extractGeometry(Map<String,Object> osrm){
    List<Map<String,Object>> routes = (List<Map<String,Object>>) osrm.getOrDefault("routes", List.of());
    return routes.isEmpty()? Map.of() : (Map<String,Object>) routes.get(0).get("geometry");
  }
}
