package com.tripmate.service;

import com.tripmate.dto.RegionChatMessageRequest;
import com.tripmate.dto.RegionChatMessageResponse;
import com.tripmate.entity.Member;
import com.tripmate.entity.RegionChatMessage;
import com.tripmate.repository.RegionChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionChatService {
    
    private final RegionChatMessageRepository regionChatMessageRepository;
    
    // 메시지 전송
    @Transactional
    public RegionChatMessageResponse sendMessage(RegionChatMessageRequest request, Member member) {
        RegionChatMessage message = RegionChatMessage.builder()
            .city(request.getCity())
            .message(request.getContent())
            .member(member)
            .build();
        
        RegionChatMessage savedMessage = regionChatMessageRepository.save(message);
        return convertToResponse(savedMessage);
    }
    
    // 특정 도시의 메시지 조회 (페이지네이션)
    public Page<RegionChatMessageResponse> getMessages(String city, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<RegionChatMessage> messages = regionChatMessageRepository
            .findByCityOrderByCreatedAtDesc(city, pageable);
        
        return messages.map(this::convertToResponse);
    }
    
    // 특정 도시의 최근 메시지 조회 (새 메시지 확인용)
    public List<RegionChatMessageResponse> getNewMessages(String city, Long lastMessageId) {
        List<RegionChatMessage> messages = regionChatMessageRepository
            .findNewMessagesAfterId(city, lastMessageId);
        
        return messages.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // 특정 도시의 메시지 수 조회
    public long getMessageCount(String city) {
        return regionChatMessageRepository.countByCity(city);
    }
    
    // DTO 변환
    private RegionChatMessageResponse convertToResponse(RegionChatMessage message) {
        return RegionChatMessageResponse.builder()
            .id(message.getId())
            .content(message.getMessage())
            .memberId(message.getMember().getId())
            .memberName(message.getMember().getNickname())
            .memberProfileImg(message.getMember().getProfileImg())
            .city(message.getCity())
            .createdAt(message.getCreatedAt())
            .build();
    }
}
