    package com.tripmate.repository;
    import com.tripmate.entity.ChatRoom;
    import com.tripmate.entity.ChatRoomMember;
    import com.tripmate.entity.Member;
    import org.springframework.data.jpa.repository.JpaRepository;
    import java.util.List;
    import java.util.Optional;
    public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
        boolean existsByRoomAndMember(ChatRoom room, Member member);
        Optional<ChatRoomMember> findByRoomAndMember(ChatRoom room, Member member);
        long countByRoom(ChatRoom room);
        void deleteByRoomAndMember(ChatRoom room, Member member);
        List<ChatRoomMember> findByRoomOrderByIdAsc(ChatRoom room);
    }
    