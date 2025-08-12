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
            
            // WeatherAPI에서 제공하는 아이콘 URL 사용
            try {
                String iconUrl = conditionNode.get("icon").asText();
                // WeatherAPI 아이콘 URL이 상대 경로로 오므로 https: 추가
                if (iconUrl.startsWith("//")) {
                    iconUrl = "https:" + iconUrl;
                }
                weatherInfo.setWeatherIcon(iconUrl);
                System.out.println("🌤️ [WeatherService] WeatherAPI 아이콘 URL: " + iconUrl);
            } catch (Exception e) {
                System.err.println("🌤️ [WeatherService] WeatherAPI 아이콘 URL 생성 실패: " + e.getMessage());
                // 실패 시 이모지로 대체
                try {
                    int conditionCode = conditionNode.get("code").asInt();
                    String weatherEmoji = getWeatherEmoji(conditionCode);
                    weatherInfo.setWeatherIcon(weatherEmoji);
                    System.out.println("🌤️ [WeatherService] 대체 이모지 생성: " + weatherEmoji);
                } catch (Exception emojiError) {
                    weatherInfo.setWeatherIcon("🌤️"); // 최종 기본값
                }
            }

            return weatherInfo;

        } catch (Exception e) {
            throw new RuntimeException("날씨 데이터 파싱 실패: " + e.getMessage());
        }
        }
    
    // 날씨 조건 코드에 따른 이모지 반환
    private String getWeatherEmoji(int conditionCode) {
        switch (conditionCode) {
            case 1000: return "☀️"; // 맑음
            case 1003: return "⛅"; // 구름 조금
            case 1006: return "☁️"; // 구름 많음
            case 1009: return "☁️"; // 흐림
            case 1030: return "🌫️"; // 안개
            case 1063: return "🌦️"; // 가벼운 비
            case 1066: return "🌨️"; // 가벼운 눈
            case 1069: return "🌨️"; // 가벼운 비/눈
            case 1087: return "⛈️"; // 천둥번개
            case 1114: return "🌨️"; // 눈
            case 1117: return "❄️"; // 폭설
            case 1135: return "🌫️"; // 안개
            case 1147: return "🌫️"; // 짙은 안개
            case 1150: return "🌦️"; // 가벼운 이슬비
            case 1153: return "🌦️"; // 이슬비
            case 1168: return "🌧️"; // 얼음비
            case 1171: return "🌧️"; // 얼음비
            case 1180: return "🌦️"; // 가벼운 이슬비
            case 1183: return "🌦️"; // 이슬비
            case 1186: return "🌧️"; // 중간 비
            case 1189: return "🌧️"; // 중간 비
            case 1192: return "🌧️"; // 강한 비
            case 1195: return "🌧️"; // 강한 비
            case 1198: return "🌦️"; // 가벼운 이슬비
            case 1201: return "🌧️"; // 중간 이슬비
            case 1204: return "🌨️"; // 가벼운 비/눈
            case 1207: return "🌨️"; // 중간 비/눈
            case 1210: return "🌨️"; // 가벼운 눈
            case 1213: return "🌨️"; // 가벼운 눈
            case 1216: return "🌨️"; // 중간 눈
            case 1219: return "🌨️"; // 중간 눈
            case 1222: return "❄️"; // 강한 눈
            case 1225: return "❄️"; // 강한 눈
            case 1237: return "🧊"; // 우박
            case 1240: return "🌦️"; // 가벼운 이슬비
            case 1243: return "🌧️"; // 중간 이슬비
            case 1246: return "🌧️"; // 강한 이슬비
            case 1249: return "🌨️"; // 가벼운 비/눈
            case 1252: return "🌨️"; // 중간 비/눈
            case 1255: return "🌨️"; // 가벼운 눈
            case 1258: return "🌨️"; // 중간 눈
            case 1261: return "🌨️"; // 가벼운 우박
            case 1264: return "🧊"; // 중간 우박
            case 1273: return "⛈️"; // 가벼운 비/천둥번개
            case 1276: return "⛈️"; // 강한 비/천둥번개
            default: return "🌤️"; // 기본값
        }
    }
}