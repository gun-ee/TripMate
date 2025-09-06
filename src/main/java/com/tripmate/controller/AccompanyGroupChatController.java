    package com.tripmate.controller;
    import com.tripmate.config.CustomUserDetails;
    import com.tripmate.entity.AccompanyApplication;
    import com.tripmate.repository.AccompanyApplicationRepository;
    import com.tripmate.service.ChatService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.core.annotation.AuthenticationPrincipal;
    import org.springframework.web.bind.annotation.*;
    import java.util.*;
    @RestController @RequiredArgsConstructor @RequestMapping("/api/accompany")
    public class AccompanyGroupChatController {
        private final ChatService chatService;
        private final AccompanyApplicationRepository appRepo;
        @PostMapping("/{postId}/close-and-create-room")
        public ResponseEntity<Map<String, Object>> closeAndCreateRoom(@PathVariable Long postId, @AuthenticationPrincipal CustomUserDetails user, @RequestBody(required=false) Map<String,Object> body) {
            String name = body!=null ? (String) body.getOrDefault("name", "동행방 #"+postId) : ("동행방 #"+postId);
            List<AccompanyApplication> apps = appRepo.findByPostId(postId);
            List<Long> memberIds = new ArrayList<>();
            for (AccompanyApplication a : apps) {
                if (a.getStatus() == AccompanyApplication.Status.ACCEPTED && a.getApplicant()!=null && a.getApplicant().getId()!=null) {
                    memberIds.add(a.getApplicant().getId());
                }
            }
            Long roomId = chatService.createRoom(user.getMember().getId(), name, memberIds);
            return ResponseEntity.ok(Map.of("roomId", roomId, "name", name));
        }
    }
    