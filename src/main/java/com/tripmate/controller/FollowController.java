package com.tripmate.controller;

import com.tripmate.config.CustomUserDetails;
import com.tripmate.entity.Member;
import com.tripmate.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/follow")
public class FollowController {

    private final FollowService followService;

    // 현재 로그인한 사용자 정보 가져오기
    private Member getCurrentMember() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();

        if (principal instanceof CustomUserDetails cud) {
            return cud.getMember();
        }

        throw new IllegalStateException("인증된 사용자 정보를 찾을 수 없습니다.");
    }

    // 팔로우하기
    @PostMapping("/{targetUserId}")
    public ResponseEntity<Map<String, Object>> follow(@PathVariable Long targetUserId) {
        try {
            Member currentUser = getCurrentMember();
            boolean success = followService.follow(currentUser.getId(), targetUserId);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "팔로우했습니다.",
                    "isFollowing", true
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "이미 팔로우 중입니다.",
                    "isFollowing", true
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 언팔로우하기
    @DeleteMapping("/{targetUserId}")
    public ResponseEntity<Map<String, Object>> unfollow(@PathVariable Long targetUserId) {
        try {
            Member currentUser = getCurrentMember();
            boolean success = followService.unfollow(currentUser.getId(), targetUserId);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "언팔로우했습니다.",
                    "isFollowing", false
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "팔로우하지 않은 상태입니다.",
                    "isFollowing", false
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 팔로우 상태 확인
    @GetMapping("/{targetUserId}/status")
    public ResponseEntity<Map<String, Object>> getFollowStatus(@PathVariable Long targetUserId) {
        try {
            Member currentUser = getCurrentMember();
            boolean isFollowing = followService.isFollowing(currentUser.getId(), targetUserId);
            
            return ResponseEntity.ok(Map.of(
                "isFollowing", isFollowing
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 팔로워/팔로잉 수 조회
    @GetMapping("/{userId}/counts")
    public ResponseEntity<Map<String, Object>> getFollowCounts(@PathVariable Long userId) {
        try {
            long followerCount = followService.getFollowerCount(userId);
            long followingCount = followService.getFollowingCount(userId);
            
            return ResponseEntity.ok(Map.of(
                "followerCount", followerCount,
                "followingCount", followingCount
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 팔로워 목록 조회
    @GetMapping("/{userId}/followers")
    public ResponseEntity<Map<String, Object>> getFollowers(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> followers = followService.getFollowers(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "followers", followers
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 팔로잉 목록 조회
    @GetMapping("/{userId}/following")
    public ResponseEntity<Map<String, Object>> getFollowing(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> following = followService.getFollowing(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "following", following
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
