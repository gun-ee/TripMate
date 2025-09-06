    package com.tripmate.repository;
    import com.tripmate.entity.ChatRoom;
    import com.tripmate.entity.Member;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Query;
    import java.util.List;
    public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
        @Query("select r from ChatRoom r join r.members m where m.member = :member")
        List<ChatRoom> findRoomsByMember(Member member);
    }
    