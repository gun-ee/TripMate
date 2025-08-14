// src/main/java/com/tripmate/controller/WeatherController.java
package com.tripmate.controller;

import com.tripmate.dto.WeatherInfo;
import com.tripmate.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class WeatherController {

    @Autowired
    private WeatherService weatherService;

    @GetMapping("/osaka")
    public ResponseEntity<WeatherInfo> getOsakaWeather() {
        try {
            WeatherInfo weather = weatherService.getWeather("Osaka");
            return ResponseEntity.ok(weather);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{city}")
    public ResponseEntity<WeatherInfo> getWeatherByCity(@PathVariable String city) {
        try {
            WeatherInfo weather = weatherService.getWeather(city);
            return ResponseEntity.ok(weather);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 4개 도시의 날씨 정보를 한 번에 가져오는 엔드포인트
    @GetMapping("/cities")
    public ResponseEntity<List<WeatherInfo>> getAllCitiesWeather() {
        try {
            List<WeatherInfo> weatherList = new ArrayList<>();
            
            // 4개 도시의 날씨 정보 수집
            weatherList.add(weatherService.getWeather("Osaka"));
            weatherList.add(weatherService.getWeather("Fukuoka"));
            weatherList.add(weatherService.getWeather("Tokyo"));
            weatherList.add(weatherService.getWeather("Sapporo"));
            
            return ResponseEntity.ok(weatherList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 테스트용 간단한 엔드포인트
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Weather API is working!");
    }
}