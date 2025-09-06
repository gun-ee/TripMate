    package com.tripmate.controller;
    import com.tripmate.service.ChatbotService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import java.util.Map;
    @RestController @RequiredArgsConstructor @RequestMapping("/api/chatbot")
    public class ChatbotController {
        private final ChatbotService service;
        @PostMapping("/query")
        public ResponseEntity<Map<String, Object>> query(@RequestBody Map<String, String> body) {
            String prompt = body.getOrDefault("prompt", ""); return ResponseEntity.ok(service.reply(prompt));
        }
    }
    