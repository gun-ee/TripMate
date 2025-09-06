package com.tripmate.controller;

import com.tripmate.dto.AccompanyCommentDtos;
import com.tripmate.service.AccompanyCommentService;
import com.tripmate.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accompany-comments")
public class AccompanyCommentController {

    private final AccompanyCommentService service;

    private Long currentMemberId() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        return userDetails.getMember().getId();
    }

    // 댓글 목록 조회
    @GetMapping("/post/{postId}")
    public AccompanyCommentDtos.ListResponse getComments(@PathVariable Long postId) {
        return service.getCommentsByPostId(postId);
    }

    // 댓글 작성
    @PostMapping("/post/{postId}")
    public AccompanyCommentDtos.Response createComment(@PathVariable Long postId, 
                                                      @RequestBody AccompanyCommentDtos.Create request) {
        return service.createComment(currentMemberId(), postId, request);
    }

    // 댓글 수정
    @PutMapping("/{commentId}")
    public AccompanyCommentDtos.Response updateComment(@PathVariable Long commentId, 
                                                      @RequestBody AccompanyCommentDtos.Update request) {
        return service.updateComment(currentMemberId(), commentId, request);
    }

    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public void deleteComment(@PathVariable Long commentId) {
        service.deleteComment(currentMemberId(), commentId);
    }
}
