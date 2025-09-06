    package com.tripmate.service;
    import lombok.RequiredArgsConstructor;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.stereotype.Service;
    import java.util.Map;
    @Service @RequiredArgsConstructor
    public class ChatbotService {
        @Value("${openai.apiKey:}") private String openAiKey;
        public Map<String, Object> reply(String prompt) {
            String p = prompt==null? "": prompt.toLowerCase();
            if (p.contains("일정") || p.contains("동선") || p.contains("tsp"))
                return Map.of("answer","시작/종료 고정 후 TSP 근사로 장소 정렬, OSRM 등으로 이동시간 산출, 체류시간 합산하여 일자별 타임라인을 구성하세요. TripMate는 장소 스냅샷과 leg 테이블을 함께 저장하는 방식을 권장합니다.");
            if (p.contains("맛집") || p.contains("추천"))
                return Map.of("answer","영업시간/혼잡도 기준으로 낮-저녁-야경 코스를 분리 추천합니다. 실제 추천은 OTM/Kakao 등 외부 API 연동을 권장합니다.");
            if (openAiKey==null || openAiKey.isBlank())
                return Map.of("answer","데모 응답입니다. 구체적인 여행 정보를 알려주시면 더 정교한 답변을 드립니다.");
            return Map.of("answer","OpenAI 연동이 활성화되면 실제 답변을 반환합니다.");
        }
    }
    