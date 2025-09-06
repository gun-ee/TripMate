package com.tripmate.controller;

import com.tripmate.dto.MyPostsResponses;
import com.tripmate.service.MyPostsService;
import com.tripmate.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my-posts")
public class MyPostsController {

    private final MyPostsService service;

    private Long currentMemberId() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        return userDetails.getMember().getId();
    }

    // 내가 작성한 모든 게시글 조회 (트립톡 + 동행구하기)
    @GetMapping
    public MyPostsResponses.AllPosts getMyPosts() {
        return service.getMyPosts(currentMemberId());
    }
}
