package com.tripmate.controller;
import com.tripmate.config.CustomUserDetails;
import com.tripmate.dto.ChatDtos;
import com.tripmate.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
    @RestController @RequiredArgsConstructor @RequestMapping("/api/chat")
    public class ChatController {
        private final ChatService chatService;
        @PostMapping("/rooms")
        public Map<String, Long> createRoom(@AuthenticationPrincipal CustomUserDetails user, @RequestBody Map<String, Object> body) {
            String name = (String) body.getOrDefault("name", "채팅방");
            @SuppressWarnings("unchecked") List<Integer> ids = (List<Integer>) body.getOrDefault("memberIds", List.of());
            List<Long> memberIds = ids.stream().map(Integer::longValue).toList();
            Long id = chatService.createRoom(user.getMember().getId(), name, memberIds);
            return Map.of("roomId", id);
        }
        @GetMapping("/rooms") public List<ChatDtos.RoomSummary> myRooms(@AuthenticationPrincipal CustomUserDetails user) {
            return chatService.myRooms(user.getMember().getId());
        }
        @DeleteMapping("/rooms/{roomId}/leave") public Map<String, Object> leave(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
            return chatService.leaveRoom(user.getMember().getId(), roomId);
        }
        @GetMapping("/rooms/{roomId}") public ChatDtos.RoomDetail getRoomDetail(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
            return chatService.getRoomDetail(user.getMember().getId(), roomId);
        }
        @GetMapping("/rooms/{roomId}/messages") public List<ChatDtos.MessageView> getMessages(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
            return chatService.getMessages(user.getMember().getId(), roomId);
        }
        @MessageMapping("/chat/{roomId}")
        public ChatDtos.MessageView handleMessage(@Payload ChatDtos.SendMessage msg, @DestinationVariable Long roomId, SimpMessageHeaderAccessor accessor) {
            // WebSocket에서 인증된 사용자 정보 가져오기
            Authentication auth = (Authentication) accessor.getUser();
            CustomUserDetails user = null;
            
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
                user = (CustomUserDetails) auth.getPrincipal();
                System.out.println("📤 [ChatController] Authentication에서 사용자 정보 가져옴: " + user.getMemberId());
            } else {
                // sessionAttributes에서 직접 가져오기
                user = (CustomUserDetails) accessor.getSessionAttributes().get("userDetails");
                if (user == null) {
                    Long memberId = (Long) accessor.getSessionAttributes().get("memberId");
                    if (memberId != null) {
                        System.out.println("📤 [ChatController] sessionAttributes에서 memberId 가져옴: " + memberId);
                        // memberId만 있는 경우를 위한 처리
                        ChatDtos.MessageView result = chatService.send(memberId, roomId, msg.getContent());
                        System.out.println("📤 [ChatController] 메시지 처리 완료 - messageId: " + result.getId());
                        return result;
                    }
                } else {
                    System.out.println("📤 [ChatController] sessionAttributes에서 사용자 정보 가져옴: " + user.getMemberId());
                }
            }
            
            if (user == null) {
                System.out.println("❌ [ChatController] 인증된 사용자 정보가 없습니다.");
                throw new RuntimeException("인증이 필요합니다.");
            }
            
            System.out.println("📤 [ChatController] 메시지 수신 - roomId: " + roomId + ", content: " + msg.getContent() + ", senderId: " + user.getMemberId());
            ChatDtos.MessageView result = chatService.send(user.getMemberId(), roomId, msg.getContent());
            System.out.println("📤 [ChatController] 메시지 처리 완료 - messageId: " + result.getId());
            return result;
        }
    }
    