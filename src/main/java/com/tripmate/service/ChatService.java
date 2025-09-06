    package com.tripmate.service;
    import com.tripmate.constant.NotificationType;
    import com.tripmate.dto.ChatDtos;
    import com.tripmate.entity.ChatMessage;
    import com.tripmate.entity.ChatRoom;
    import com.tripmate.entity.ChatRoomMember;
    import com.tripmate.entity.Member;
    import com.tripmate.repository.ChatMessageRepository;
    import com.tripmate.repository.ChatRoomMemberRepository;
    import com.tripmate.repository.ChatRoomRepository;
    import com.tripmate.repository.MemberRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.messaging.simp.SimpMessagingTemplate;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import java.time.LocalDateTime;
    import java.util.*;
    import java.util.stream.Collectors;
    @Service @RequiredArgsConstructor
    public class ChatService {
        private final ChatRoomRepository roomRepo;
        private final ChatRoomMemberRepository memberRepo;
        private final ChatMessageRepository messageRepo;
        private final MemberRepository members;
        private final SimpMessagingTemplate messaging;
        private final NotificationService notificationService;
        @Transactional
        public Long createRoom(Long ownerId, String name, List<Long> initialMemberIds) {
            Member owner = members.findById(ownerId).orElseThrow();
            ChatRoom room = ChatRoom.builder().name(name).owner(owner).createdAt(LocalDateTime.now()).build();
            roomRepo.save(room);
            memberRepo.save(ChatRoomMember.builder().room(room).member(owner).build());
            Set<Long> added = new HashSet<>(); added.add(ownerId);
            for (Long id : initialMemberIds) {
                if (id == null || added.contains(id)) continue;
                members.findById(id).ifPresent(m -> {
                    if (!memberRepo.existsByRoomAndMember(room, m))
                        memberRepo.save(ChatRoomMember.builder().room(room).member(m).build());
                });
                added.add(id);
            }
            added.stream().filter(id -> !Objects.equals(id, ownerId)).forEach(id -> {
                members.findById(id).ifPresent(m -> notificationService.notify(
                    m, NotificationType.GROUP_CHAT_CREATED, "여행 단체채팅방이 생성되었습니다: " + name, "/chat/rooms", room.getId()
                ));
            });
            return room.getId();
        }
        @Transactional(readOnly = true)
        public List<ChatDtos.RoomSummary> myRooms(Long myId) {
            Member me = members.findById(myId).orElseThrow();
            List<ChatRoom> rooms = roomRepo.findRoomsByMember(me);
            return rooms.stream().map(r -> {
                int count = (int) memberRepo.countByRoom(r);
                String lastMsg = ""; String lastTime = null;
                List<ChatMessage> last = messageRepo.findTop100ByRoomOrderBySentAtDesc(r);
                if (!last.isEmpty()) { ChatMessage lm = last.get(0); lastMsg = lm.getContent(); lastTime = lm.getSentAt().toString(); }
                return ChatDtos.RoomSummary.builder().id(r.getId()).name(r.getName()).memberCount(count).lastMessage(lastMsg).lastMessageTime(lastTime).build();
            }).sorted((a,b)->{
                String at=a.getLastMessageTime(), bt=b.getLastMessageTime();
                if (at==null && bt==null) return 0; if (at==null) return 1; if (bt==null) return -1; return bt.compareTo(at);
            }).collect(Collectors.toList());
        }
        @Transactional
        public ChatDtos.MessageView send(Long senderId, Long roomId, String content) {
            System.out.println("💬 [ChatService] 메시지 저장 시작 - senderId: " + senderId + ", roomId: " + roomId + ", content: " + content);
            Member sender = members.findById(senderId).orElseThrow();
            ChatRoom room = roomRepo.findById(roomId).orElseThrow();
            if (memberRepo.findByRoomAndMember(room, sender).isEmpty()) {
                System.out.println("❌ [ChatService] 사용자가 채팅방 멤버가 아님 - senderId: " + senderId + ", roomId: " + roomId);
                throw new IllegalStateException("NOT_A_MEMBER");
            }
            ChatMessage saved = messageRepo.save(ChatMessage.builder().room(room).sender(sender).content(content).sentAt(LocalDateTime.now()).build());
            System.out.println("💾 [ChatService] 메시지 DB 저장 완료 - messageId: " + saved.getId());
            ChatDtos.MessageView view = ChatDtos.MessageView.of(saved);
            System.out.println("📡 [ChatService] WebSocket으로 메시지 브로드캐스트 - destination: /topic/chat/" + roomId);
            messaging.convertAndSend("/topic/chat/" + roomId, view);
            return view;
        }
        @Transactional
        public Map<String, Object> leaveRoom(Long userId, Long roomId) {
            Member user = members.findById(userId).orElseThrow();
            ChatRoom room = roomRepo.findById(roomId).orElseThrow();
            if (memberRepo.findByRoomAndMember(room, user).isEmpty()) throw new IllegalStateException("NOT_A_MEMBER");
            memberRepo.deleteByRoomAndMember(room, user);
            long remaining = memberRepo.countByRoom(room);
            Map<String, Object> resp = new HashMap<>();
            if (remaining == 0) { messageRepo.deleteByRoom(room); roomRepo.delete(room); resp.put("roomDeleted", true); return resp; }
            if (room.getOwner()!=null && Objects.equals(room.getOwner().getId(), userId)) {
                List<ChatRoomMember> rest = memberRepo.findByRoomOrderByIdAsc(room);
                if (!rest.isEmpty()) room.setOwner(rest.get(0).getMember()); else room.setOwner(null);
            }
            resp.put("roomDeleted", false);
            return resp;
        }
    }
    