package com.tripmate.controller;

import com.tripmate.dto.AccompanyApplicationResponses;
import com.tripmate.service.AccompanyApplicationService;
import com.tripmate.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accompany-applications")
public class AccompanyApplicationController {

    private final AccompanyApplicationService service;

    private Long currentMemberId() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        return userDetails.getMember().getId();
    }

    // 내가 작성한 게시글들의 신청자 목록 조회
    @GetMapping("/my-posts")
    public List<AccompanyApplicationResponses.PostWithApplications> getMyPostsWithApplications() {
        return service.getMyPostsWithApplications(currentMemberId());
    }

    // 특정 게시글의 신청자 목록 조회
    @GetMapping("/post/{postId}")
    public List<AccompanyApplicationResponses.ApplicationItem> getApplicationsByPostId(@PathVariable Long postId) {
        return service.getApplicationsByPostId(postId, currentMemberId());
    }

    // 신청 상태 업데이트 (수락/거절)
    @PutMapping("/{applicationId}/status")
    public void updateApplicationStatus(@PathVariable Long applicationId, 
                                      @RequestParam String status) {
        service.updateApplicationStatus(applicationId, currentMemberId(), status);
    }
}