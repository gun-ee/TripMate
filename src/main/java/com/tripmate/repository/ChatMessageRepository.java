    package com.tripmate.repository;
    import com.tripmate.entity.ChatMessage;
    import com.tripmate.entity.ChatRoom;
    import org.springframework.data.jpa.repository.JpaRepository;
    import java.util.List;
    public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
        List<ChatMessage> findTop100ByRoomOrderBySentAtDesc(ChatRoom room);
        void deleteByRoom(ChatRoom room);
    }
    