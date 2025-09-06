    package com.tripmate.constant;
    import lombok.AllArgsConstructor;
    import lombok.Getter;
    @Getter @AllArgsConstructor
    public enum NotificationType {
        GROUP_CHAT_CREATED("단체채팅방 생성"),
        ACCOMPANY_APPLICATION("동행 신청");
        private final String description;
    }
    