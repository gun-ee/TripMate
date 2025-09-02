package com.tripmate.mypage;

import com.tripmate.mypage.dto.MyProfileResponse;
import com.tripmate.mypage.dto.MyTripsPageResponse;
import com.tripmate.entity.Member;
import com.tripmate.repository.MemberRepository; // 프로젝트에 이미 존재한다고 가정
import com.tripmate.config.CustomUserDetails;    // 프로젝트 보안 컨벤션
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
public class MyPageController {

    private final MyPageService myPageService;
    private final MemberRepository memberRepository;

    // 프로젝트 컨벤션: CustomUserDetails → Member 직접 획득
    private Member currentMember() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();

        if (principal instanceof CustomUserDetails cud) {
            return cud.getMember();
        }
        // 그 외 환경 대비: username/email 로 조회
        String username;
        if (principal instanceof UserDetails ud) username = ud.getUsername();
        else username = String.valueOf(principal);

        return memberRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalStateException("member not found by email: " + username));
    }

    @GetMapping("/profile")
    public MyProfileResponse myProfile() {
        return myPageService.loadProfile(currentMember());
    }

    @GetMapping("/trips")
    public MyTripsPageResponse myTrips(@RequestParam(required = false) Long cursorId,
                                       @RequestParam(defaultValue = "12") int size) {
        return myPageService.loadMyTrips(currentMember(), cursorId, size);
    }

    // 특정 유저의 프로필 조회
    @GetMapping("/profile/{userId}")
    public MyProfileResponse userProfile(@PathVariable Long userId) {
        Member targetMember = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return myPageService.loadProfile(targetMember);
    }

    // 특정 유저의 여행 목록 조회
    @GetMapping("/trips/{userId}")
    public MyTripsPageResponse userTrips(@PathVariable Long userId,
                                         @RequestParam(required = false) Long cursorId,
                                         @RequestParam(defaultValue = "12") int size) {
        Member targetMember = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return myPageService.loadMyTrips(targetMember, cursorId, size);
    }
}
