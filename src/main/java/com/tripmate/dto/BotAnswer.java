package com.tripmate.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BotAnswer {
    private String answer;          // plain text answer
    private List<String> items;     // related items/keywords
    private List<String> suggestions;// follow-up suggestions
    private Itinerary itinerary;    // optional itinerary

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Itinerary {
        private List<Day> days;
    }
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Day {
        private int day;
        private List<Plan> plan;
    }
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Plan {
        private String time;
        private String title;
    }
}
