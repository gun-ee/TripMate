package com.tripmate.controller;

import com.tripmate.dto.PostCreateRequest;
import com.tripmate.dto.PostListResponse;
import com.tripmate.dto.LikeResponse;
import com.tripmate.entity.Member;
import com.tripmate.config.CustomUserDetails;
import com.tripmate.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {
    
    private final PostService postService;
    
    // 게시글 작성
    @PostMapping
    public ResponseEntity<PostListResponse> createPost(
            @RequestParam String title,
            @RequestParam String content,
            @RequestPart(required = false) MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("게시글 작성 요청: {}", title);
        log.info("인증된 사용자: {}", userDetails != null ? userDetails.getMemberId() : "NULL");
        log.info("사용자 정보: {}", userDetails);
        
        Member member = userDetails != null ? userDetails.getMember() : null;
        
        PostCreateRequest request = PostCreateRequest.builder()
                .title(title)
                .content(content)
                .build();
        
        PostListResponse response = postService.createPost(request, member, image);
        
        return ResponseEntity.ok(response);
    }
    
    // 게시글 목록 조회 (페이지네이션)
    @GetMapping
    public ResponseEntity<Page<PostListResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Pageable pageable = PageRequest.of(page, size);
        Long memberId = userDetails != null ? userDetails.getMemberId() : null;
        
        Page<PostListResponse> posts = postService.getPosts(pageable, memberId);
        
        return ResponseEntity.ok(posts);
    }
    
    // 게시글 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<PostListResponse> getPost(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long memberId = userDetails != null ? userDetails.getMemberId() : null;
        PostListResponse post = postService.getPostById(id, memberId);
        
        return ResponseEntity.ok(post);
    }
    
    // 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<PostListResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        
        Member member = userDetails.getMember();
        log.info("게시글 수정 요청: {}", id);
        
        PostListResponse response = postService.updatePost(id, request, member);
        return ResponseEntity.ok(response);
    }
    
    // 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        
        Member member = userDetails.getMember();
        log.info("게시글 삭제 요청: {}", id);
        
        postService.deletePost(id, member);
        return ResponseEntity.ok().build();
    }
    
    // 좋아요 처리
    @PostMapping("/{id}/like")
    public ResponseEntity<LikeResponse> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        
        log.info("좋아요 처리: 게시글 {}, 사용자 {}", id, userDetails.getMemberId());
        
        LikeResponse response = postService.toggleLike(id, userDetails.getMemberId());
        
        return ResponseEntity.ok(response);
    }
}
