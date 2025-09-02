package com.tripmate.service;

import com.tripmate.entity.Follow;
import com.tripmate.entity.Member;
import com.tripmate.repository.FollowRepository;
import com.tripmate.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FollowService {

    private final FollowRepository followRepository;
    private final MemberRepository memberRepository;

    // 팔로우하기
    public boolean follow(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        Member follower = memberRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("팔로워를 찾을 수 없습니다."));
        
        Member following = memberRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("팔로잉 대상을 찾을 수 없습니다."));

        // 이미 팔로우하고 있는지 확인
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            return false; // 이미 팔로우 중
        }

        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();

        followRepository.save(follow);
        return true;
    }

    // 언팔로우하기
    public boolean unfollow(Long followerId, Long followingId) {
        Member follower = memberRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("팔로워를 찾을 수 없습니다."));
        
        Member following = memberRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("팔로잉 대상을 찾을 수 없습니다."));

        if (!followRepository.existsByFollowerAndFollowing(follower, following)) {
            return false; // 팔로우하지 않은 상태
        }

        followRepository.deleteByFollowerAndFollowing(follower, following);
        return true;
    }

    // 팔로우 상태 확인
    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            return false; // 자기 자신은 팔로우하지 않은 것으로 처리
        }

        Member follower = memberRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("팔로워를 찾을 수 없습니다."));
        
        Member following = memberRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("팔로잉 대상을 찾을 수 없습니다."));

        return followRepository.existsByFollowerAndFollowing(follower, following);
    }

    // 팔로워 수 조회
    @Transactional(readOnly = true)
    public long getFollowerCount(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        return followRepository.countByFollowing(member);
    }

    // 팔로잉 수 조회
    @Transactional(readOnly = true)
    public long getFollowingCount(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        return followRepository.countByFollower(member);
    }
}
