    package com.tripmate.dto;
    import com.tripmate.entity.ChatMessage;
    import lombok.*;
    import java.time.LocalDateTime;
    public class ChatDtos {
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class RoomSummary {
            private Long id; private String name; private int memberCount;
            private String lastMessage; private String lastMessageTime;
        }
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class SendMessage { private Long roomId; private String content; }
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class MessageView {
            private Long id; private Long roomId; private Long senderId; private String content; private LocalDateTime sentAt;
            public static MessageView of(ChatMessage m) {
                return MessageView.builder().id(m.getId()).roomId(m.getRoom().getId())
                    .senderId(m.getSender().getId()).content(m.getContent()).sentAt(m.getSentAt()).build();
            }
        }
    }
    