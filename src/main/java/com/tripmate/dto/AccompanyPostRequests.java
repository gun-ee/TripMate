package com.tripmate.dto;

import lombok.*;

public class AccompanyPostRequests {
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Create {
        private Long tripId;
        private String title;
        private String content;
    }
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Update {
        private String title;
        private String content;
    }
}
