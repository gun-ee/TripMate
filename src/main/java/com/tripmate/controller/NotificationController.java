    package com.tripmate.controller;
    import com.tripmate.config.CustomUserDetails;
    import com.tripmate.dto.NotificationDto;
    import com.tripmate.service.NotificationService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.data.domain.Page;
    import org.springframework.data.domain.PageRequest;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.core.annotation.AuthenticationPrincipal;
    import org.springframework.web.bind.annotation.*;
    import java.util.List;
    import java.util.Map;
    @RestController @RequiredArgsConstructor @RequestMapping("/api/notifications")
    public class NotificationController {
        private final NotificationService notificationService;
        @GetMapping public Page<NotificationDto> list(@AuthenticationPrincipal CustomUserDetails user, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
            return notificationService.list(user.getUsername(), PageRequest.of(page, size));
        }
        @GetMapping("/unread") public List<NotificationDto> unread(@AuthenticationPrincipal CustomUserDetails user) {
            return notificationService.unreadList(user.getUsername());
        }
        @GetMapping("/unread-count") public Map<String, Long> unreadCount(@AuthenticationPrincipal CustomUserDetails user) {
            return Map.of("count", notificationService.unreadCount(user.getUsername()));
        }
        @PutMapping("/{id}/read") public ResponseEntity<?> markAsRead(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
            notificationService.markAsRead(id, user.getUsername()); return ResponseEntity.ok(Map.of("ok", true));
        }
        @PutMapping("/read-all") public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal CustomUserDetails user) {
            notificationService.markAllAsRead(user.getUsername()); return ResponseEntity.ok(Map.of("ok", true));
        }
    }
    