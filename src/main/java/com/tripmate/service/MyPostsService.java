package com.tripmate.service;

import com.tripmate.dto.MyPostsResponses;
import com.tripmate.entity.Post;
import com.tripmate.entity.AccompanyPost;
import com.tripmate.repository.PostRepository;
import com.tripmate.repository.AccompanyPostRepository;
import com.tripmate.repository.AccompanyApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPostsService {

    private final PostRepository postRepository;
    private final AccompanyPostRepository accompanyPostRepository;
    private final AccompanyApplicationRepository applicationRepository;

    public MyPostsResponses.AllPosts getMyPosts(Long memberId) {
        // 트립톡 게시글 조회
        List<Post> tripTalkPosts = postRepository.findByAuthorIdOrderByCreatedAtDesc(memberId);
        
        // 동행구하기 게시글 조회
        List<AccompanyPost> accompanyPosts = accompanyPostRepository.findByAuthorIdOrderByCreatedAtDesc(memberId);
        
        // 동행구하기 게시글의 신청자 수 조회
        Map<Long, Long> applicationCounts = applicationRepository.countApplicationsByPostIds(
            accompanyPosts.stream().map(AccompanyPost::getId).collect(Collectors.toList())
        ).stream()
            .collect(Collectors.toMap(
                result -> (Long) result[0],
                result -> (Long) result[1]
            ));

        // DTO 변환
        List<MyPostsResponses.TripTalkPost> tripTalkDtos = tripTalkPosts.stream()
            .map(MyPostsResponses.TripTalkPost::of)
            .collect(Collectors.toList());

        List<MyPostsResponses.AccompanyPostItem> accompanyDtos = accompanyPosts.stream()
            .map(post -> MyPostsResponses.AccompanyPostItem.of(
                post, 
                applicationCounts.getOrDefault(post.getId(), 0L).intValue()
            ))
            .collect(Collectors.toList());

        return MyPostsResponses.AllPosts.builder()
            .tripTalkPosts(tripTalkDtos)
            .accompanyPosts(accompanyDtos)
            .build();
    }
}
