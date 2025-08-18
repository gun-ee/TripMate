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
            .region(request.getRegion())
            .city(request.getCity())
            .content(request.getContent())
            .member(member)
            .authorName(member.getNickname())
            .authorProfileImg(member.getProfileImg())
            .authorLocation(request.getAuthorLocation())
            .isDeleted(false)
            .build();
        
        RegionChatMessage savedMessage = regionChatMessageRepository.save(message);
        return convertToResponse(savedMessage);
    }
    
    // 특정 지역/도시의 메시지 조회 (페이지네이션)
    public Page<RegionChatMessageResponse> getMessages(String region, String city, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<RegionChatMessage> messages = regionChatMessageRepository
            .findByRegionAndCityOrderByCreatedAtDesc(region, city, pageable);
        
        return messages.map(this::convertToResponse);
    }
    
    // 특정 지역/도시의 최근 메시지 조회 (새 메시지 확인용)
    public List<RegionChatMessageResponse> getNewMessages(String region, String city, Long lastMessageId) {
        List<RegionChatMessage> messages = regionChatMessageRepository
            .findNewMessagesAfterId(region, city, lastMessageId);
        
        return messages.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // 특정 지역/도시의 메시지 수 조회
    public long getMessageCount(String region, String city) {
        return regionChatMessageRepository.countByRegionAndCity(region, city);
    }
    
    // 메시지 삭제 (소프트 삭제)
    @Transactional
    public void deleteMessage(Long messageId, Long memberId) {
        RegionChatMessage message = regionChatMessageRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("메시지를 찾을 수 없습니다."));
        
        if (!message.getMember().getId().equals(memberId)) {
            throw new IllegalArgumentException("메시지를 삭제할 권한이 없습니다.");
        }
        
        message.setIsDeleted(true);
        regionChatMessageRepository.save(message);
    }
    
    // DTO 변환
    private RegionChatMessageResponse convertToResponse(RegionChatMessage message) {
        return RegionChatMessageResponse.builder()
            .id(message.getId())
            .content(message.getContent())
            .authorId(message.getMember().getId().toString())
            .authorName(message.getAuthorName())
            .authorProfileImg(message.getAuthorProfileImg())
            .authorLocation(message.getAuthorLocation())
            .region(message.getRegion())
            .city(message.getCity())
            .createdAt(message.getCreatedAt())
            .isDeleted(message.getIsDeleted())
            .build();
    }
}
