// src/main/java/com/tripmate/service/WeatherService.java
package com.tripmate.service;

import com.tripmate.dto.WeatherInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

@Service
public class WeatherService {

    @Value("${weather.api.key}")  // application.properties에서 API 키 관리
    private String weatherApiKey;

    private static final String WEATHER_API_URL = "http://api.weatherapi.com/v1/current.json";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WeatherInfo getWeather(String city) {
        try {
            System.out.println("🌤️ [WeatherService] 날씨 정보 요청 시작: " + city);
            System.out.println("🌤️ [WeatherService] API 키: " + weatherApiKey);
            
            String url = String.format("%s?key=%s&q=%s&aqi=no",
                    WEATHER_API_URL, weatherApiKey, city);
            
            System.out.println("🌤️ [WeatherService] 요청 URL: " + url);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            System.out.println("🌤️ [WeatherService] WeatherAPI 응답 상태: " + response.getStatusCode());

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("🌤️ [WeatherService] 응답 데이터: " + response.getBody());
                return parseWeatherResponse(response.getBody(), city);
            } else {
                throw new RuntimeException("WeatherAPI 호출 실패: " + response.getStatusCode());
            }

        } catch (Exception e) {
            System.err.println("🌤️ [WeatherService] 에러 발생: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("날씨 정보를 가져오는데 실패했습니다: " + e.getMessage());
        }
    }

    private WeatherInfo parseWeatherResponse(String jsonResponse, String city) {
        try {
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            JsonNode currentNode = rootNode.get("current");
            JsonNode conditionNode = currentNode.get("condition");

            WeatherInfo weatherInfo = new WeatherInfo();
            weatherInfo.setTempC(currentNode.get("temp_c").asDouble());
            weatherInfo.setFeelslikeC(currentNode.get("feelslike_c").asDouble());
            weatherInfo.setHumidity(currentNode.get("humidity").asInt());
            weatherInfo.setWindKph(currentNode.get("wind_kph").asDouble());
            weatherInfo.setCondition(conditionNode.get("text").asText());
            weatherInfo.setUv(currentNode.get("uv").asInt());
            weatherInfo.setVisibilityKm(currentNode.get("vis_km").asDouble());
            weatherInfo.setPressureMb(currentNode.get("pressure_mb").asDouble());
            weatherInfo.setLastUpdated(currentNode.get("last_updated").asText());
            weatherInfo.setCity(city);

            return weatherInfo;

        } catch (Exception e) {
            throw new RuntimeException("날씨 데이터 파싱 실패: " + e.getMessage());
        }
    }
}