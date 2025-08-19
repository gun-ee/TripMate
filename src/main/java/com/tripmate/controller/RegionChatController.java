package com.tripmate.controller;

import com.tripmate.dto.RegionChatMessageRequest;
import com.tripmate.dto.RegionChatMessageResponse;
import com.tripmate.entity.Member;
import com.tripmate.service.RegionChatService;
import com.tripmate.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/region-chat")
@RequiredArgsConstructor
public class RegionChatController {
    
    private final RegionChatService regionChatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MemberService memberService;
    
    // REST API: 메시지 조회 (페이지네이션)
    @GetMapping("/{city}/messages")
    public ResponseEntity<Page<RegionChatMessageResponse>> getMessages(
            @PathVariable String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<RegionChatMessageResponse> messages = regionChatService.getMessages(city, page, size);
        return ResponseEntity.ok(messages);
    }
    
    // REST API: 새 메시지 조회
    @GetMapping("/{city}/messages/new")
    public ResponseEntity<List<RegionChatMessageResponse>> getNewMessages(
            @PathVariable String city,
            @RequestParam Long lastMessageId) {
        
        List<RegionChatMessageResponse> messages = regionChatService.getNewMessages(city, lastMessageId);
        return ResponseEntity.ok(messages);
    }
    
    // REST API: 메시지 수 조회
    @GetMapping("/{city}/count")
    public ResponseEntity<Long> getMessageCount(
            @PathVariable String city) {
        
        long count = regionChatService.getMessageCount(city);
        return ResponseEntity.ok(count);
    }
    
    // WebSocket: 메시지 전송 및 브로드캐스트
    @MessageMapping("/region-chat/{city}")
    @SendTo("/topic/region-chat/{city}")
    public RegionChatMessageResponse handleMessage(
            @Payload RegionChatMessageRequest request,
            @PathVariable String city,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // UserDetails에서 Member 정보 추출
            String email = userDetails.getUsername();
            Member member = memberService.getMemberByEmail(email);
            
            // 메시지 저장
            RegionChatMessageResponse response = regionChatService.sendMessage(request, member);
            return response;
        } catch (Exception e) {
            System.err.println("메시지 처리 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            return RegionChatMessageResponse.builder()
                .content(request.getContent())
                .city(city)
                .build();
        }
    }
}

