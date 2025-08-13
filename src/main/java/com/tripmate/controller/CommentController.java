package com.tripmate.controller;

import com.tripmate.dto.CommentRequest;
import com.tripmate.dto.CommentResponse;
import com.tripmate.entity.Member;
import com.tripmate.service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
@Slf4j
public class CommentController {
    
    private final CommentService commentService;
    
    // 댓글 목록 조회
    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long postId) {
        List<CommentResponse> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(comments);
    }
    
    // 댓글 작성
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {
        
        if (member == null) {
            return ResponseEntity.status(401).build();
        }
        
        log.info("댓글 작성 요청: 게시글 {}, 사용자 {}", postId, member.getId());
        
        CommentResponse response = commentService.createComment(postId, request, member);
        return ResponseEntity.ok(response);
    }
    
    // 댓글 수정
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {
        
        if (member == null) {
            return ResponseEntity.status(401).build();
        }
        
        log.info("댓글 수정 요청: 댓글 {}, 사용자 {}", commentId, member.getId());
        
        CommentResponse response = commentService.updateComment(commentId, request, member);
        return ResponseEntity.ok(response);
    }
    
    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {
        
        if (member == null) {
            return ResponseEntity.status(401).build();
        }
        
        log.info("댓글 삭제 요청: 댓글 {}, 사용자 {}", commentId, member.getId());
        
        commentService.deleteComment(commentId, member);
        return ResponseEntity.ok().build();
    }
}
