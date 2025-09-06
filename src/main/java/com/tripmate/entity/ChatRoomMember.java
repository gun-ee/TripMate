    package com.tripmate.entity;
    import jakarta.persistence.*;
    import lombok.*;
    @Entity @Table(name="chat_room_member",
            uniqueConstraints = @UniqueConstraint(columnNames={"room_id","member_id"}))
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public class ChatRoomMember {
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
        @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="room_id",nullable=false) private ChatRoom room;
        @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="member_id",nullable=false) private Member member;
    }
    