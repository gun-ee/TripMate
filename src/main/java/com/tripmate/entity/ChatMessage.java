    package com.tripmate.entity;
    import jakarta.persistence.*;
    import lombok.*;
    import java.time.LocalDateTime;
    @Entity @Table(name="chat_message")
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public class ChatMessage {
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
        @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="room_id",nullable=false) private ChatRoom room;
        @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="sender_id",nullable=false) private Member sender;
        @Column(nullable=false,length=1000) private String content;
        @Column(nullable=false) private LocalDateTime sentAt;
    }
    