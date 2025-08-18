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

    // 여행지별 도시들의 날씨 정보를 가져오는 엔드포인트
    @GetMapping("/region/{region}")
    public ResponseEntity<List<WeatherInfo>> getWeatherByRegion(@PathVariable String region) {
        try {
            List<WeatherInfo> weatherList = new ArrayList<>();
            
            switch (region) {
                case "대한민국":
                    weatherList.add(weatherService.getWeather("Seoul"));
                    weatherList.add(weatherService.getWeather("Busan"));
                    weatherList.add(weatherService.getWeather("Jeju"));
                    weatherList.add(weatherService.getWeather("Incheon"));
                    weatherList.add(weatherService.getWeather("Gyeongju"));
                    break;
                case "동남아시아":
                    weatherList.add(weatherService.getWeather("Yangon")); // 미얀마
                    weatherList.add(weatherService.getWeather("Vientiane")); // 라오스
                    weatherList.add(weatherService.getWeather("Hanoi")); // 베트남
                    weatherList.add(weatherService.getWeather("Bangkok")); // 태국
                    weatherList.add(weatherService.getWeather("Taipei")); // 대만
                    break;
                case "일본":
                    weatherList.add(weatherService.getWeather("Osaka"));
                    weatherList.add(weatherService.getWeather("Fukuoka"));
                    weatherList.add(weatherService.getWeather("Tokyo"));
                    weatherList.add(weatherService.getWeather("Sapporo"));
                    break;
                case "유럽":
                    weatherList.add(weatherService.getWeather("Berlin")); // 독일
                    weatherList.add(weatherService.getWeather("Madrid")); // 스페인
                    weatherList.add(weatherService.getWeather("London")); // 영국
                    weatherList.add(weatherService.getWeather("Rome")); // 이탈리아
                    weatherList.add(weatherService.getWeather("Prague")); // 체코
                    weatherList.add(weatherService.getWeather("Paris")); // 프랑스
                    break;
                default:
                    // 기본값은 일본
                    weatherList.add(weatherService.getWeather("Osaka"));
                    weatherList.add(weatherService.getWeather("Fukuoka"));
                    weatherList.add(weatherService.getWeather("Tokyo"));
                    weatherList.add(weatherService.getWeather("Sapporo"));
                    break;
            }
            
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