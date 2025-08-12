// src/main/java/com/tripmate/dto/WeatherInfo.java
package com.tripmate.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherInfo {
    private double tempC;           // 현재 온도 (섭씨)
    private double feelslikeC;      // 체감 온도 (섭씨)
    private int humidity;           // 습도 (%)
    private double windKph;         // 바람 속도 (km/h)
    private String condition;       // 날씨 상태 (맑음, 흐림 등)
    private int uv;                 // 자외선 지수
    private double visibilityKm;    // 가시거리 (km)
    private double pressureMb;      // 기압 (mb)
    private String lastUpdated;     // 마지막 업데이트 시간
    private String city;            // 도시명
}