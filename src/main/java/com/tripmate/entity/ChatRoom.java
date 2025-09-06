    package com.tripmate.entity;
    import jakarta.persistence.*;
    import lombok.*;
    import java.time.LocalDateTime;
    import java.util.ArrayList;
    import java.util.List;
    @Entity @Table(name="chat_room")
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public class ChatRoom {
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
        @Column(nullable=false,length=100) private String name;
        @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="owner_id") private Member owner;
        @Column(nullable=false) private LocalDateTime createdAt;
        @OneToMany(mappedBy="room", cascade=CascadeType.ALL, orphanRemoval=true)
        @Builder.Default private List<ChatRoomMember> members = new ArrayList<>();
    }
    