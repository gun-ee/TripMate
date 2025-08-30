package com.tripmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisTestService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void testRedisConnection() {
        try {
            // Redis 연결 테스트
            redisTemplate.opsForValue().set("test:connection", "success", 60, TimeUnit.SECONDS);
            String result = (String) redisTemplate.opsForValue().get("test:connection");
            
            if ("success".equals(result)) {
                log.info("Redis 연결 성공!");
            } else {
                log.error("Redis 연결 실패: 예상값과 다름");
            }
        } catch (Exception e) {
            log.error("Redis 연결 테스트 실패: {}", e.getMessage(), e);
        }
    }

    public void setValue(String key, Object value, long timeout, TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value, timeout, timeUnit);
        log.info("Redis에 값 저장: key={}, value={}", key, value);
    }

    public Object getValue(String key) {
        Object value = redisTemplate.opsForValue().get(key);
        log.info("Redis에서 값 조회: key={}, value={}", key, value);
        return value;
    }
}
