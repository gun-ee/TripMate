package com.tripmate.controller;

import com.tripmate.service.RedisTestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/redis")
@RequiredArgsConstructor
@Slf4j
public class RedisTestController {

    private final RedisTestService redisTestService;

    @GetMapping("/test")
    public ResponseEntity<String> testRedisConnection() {
        try {
            redisTestService.testRedisConnection();
            return ResponseEntity.ok("Redis 연결 테스트 완료. 로그를 확인하세요.");
        } catch (Exception e) {
            log.error("Redis 테스트 실패", e);
            return ResponseEntity.internalServerError().body("Redis 테스트 실패: " + e.getMessage());
        }
    }

    @PostMapping("/set")
    public ResponseEntity<String> setValue(
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(defaultValue = "60") long timeout) {
        try {
            redisTestService.setValue(key, value, timeout, TimeUnit.SECONDS);
            return ResponseEntity.ok("값 저장 성공: " + key + " = " + value);
        } catch (Exception e) {
            log.error("값 저장 실패", e);
            return ResponseEntity.internalServerError().body("값 저장 실패: " + e.getMessage());
        }
    }

    @GetMapping("/get/{key}")
    public ResponseEntity<Object> getValue(@PathVariable String key) {
        try {
            Object value = redisTestService.getValue(key);
            return ResponseEntity.ok(value);
        } catch (Exception e) {
            log.error("값 조회 실패", e);
            return ResponseEntity.internalServerError().body("값 조회 실패: " + e.getMessage());
        }
    }
}
