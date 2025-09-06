    package com.tripmate.service;
    import com.tripmate.constant.NotificationType;
    import com.tripmate.dto.NotificationDto;
    import com.tripmate.entity.Member;
    import com.tripmate.entity.Notification;
    import com.tripmate.repository.MemberRepository;
    import com.tripmate.repository.NotificationRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.data.domain.Page;
    import org.springframework.data.domain.Pageable;
    import org.springframework.messaging.simp.SimpMessagingTemplate;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import java.time.LocalDateTime;
    import java.util.List;
    @Service @RequiredArgsConstructor
    public class NotificationService {
        private final NotificationRepository notificationRepository;
        private final MemberRepository memberRepository;
        private final SimpMessagingTemplate messagingTemplate;
        @Transactional
        public void notify(Member receiver, NotificationType type, String message, String linkUrl, Long relatedId) {
            Notification n = Notification.builder()
                .member(receiver).type(type).message(message).linkUrl(linkUrl)
                .relatedId(relatedId).isRead(false).createdAt(LocalDateTime.now()).build();
            notificationRepository.save(n);
            try { messagingTemplate.convertAndSend("/topic/notifications/" + receiver.getId(), NotificationDto.of(n)); } catch (Exception ignore) {}
        }
        @Transactional(readOnly = true) public Page<NotificationDto> list(String email, Pageable pageable) {
            Member m = memberRepository.findByEmail(email).orElseThrow();
            return notificationRepository.findByMemberOrderByCreatedAtDesc(m, pageable).map(NotificationDto::of);
        }
        @Transactional(readOnly = true) public List<NotificationDto> unreadList(String email) {
            Member m = memberRepository.findByEmail(email).orElseThrow();
            return notificationRepository.findByMemberAndIsReadFalseOrderByCreatedAtDesc(m).stream().map(NotificationDto::of).toList();
        }
        @Transactional(readOnly = true) public long unreadCount(String email) {
            Member m = memberRepository.findByEmail(email).orElseThrow();
            return notificationRepository.countByMemberAndIsReadFalse(m);
        }
        @Transactional public void markAsRead(Long id, String email) {
            Member m = memberRepository.findByEmail(email).orElseThrow();
            Notification n = notificationRepository.findById(id).orElseThrow();
            if (!n.getMember().getId().equals(m.getId())) throw new IllegalStateException("NOT_OWNER");
            if (!n.isRead()) { n.setRead(true); n.setReadAt(LocalDateTime.now()); }
        }
        @Transactional public void markAllAsRead(String email) {
            Member m = memberRepository.findByEmail(email).orElseThrow();
            notificationRepository.findByMemberAndIsReadFalseOrderByCreatedAtDesc(m).forEach(n -> {
                n.setRead(true); n.setReadAt(LocalDateTime.now());
            });
        }
    }
    