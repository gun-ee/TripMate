package com.tripmate.controller;

import com.tripmate.dto.BotAnswer;
import com.tripmate.service.TravelNlpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/travelbot")
public class TravelBotController {

    private final TravelNlpService service;

    @PostMapping("/ask")
    public ResponseEntity<BotAnswer> ask(@RequestBody Map<String, String> body){
        String text = body.getOrDefault("text","");
        return ResponseEntity.ok(service.answer(text));
    }
}
