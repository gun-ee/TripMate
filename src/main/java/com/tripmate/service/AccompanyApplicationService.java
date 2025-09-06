package com.tripmate.service;

import com.tripmate.dto.AccompanyApplicationResponses;
import com.tripmate.entity.AccompanyApplication;
import com.tripmate.entity.AccompanyPost;
import com.tripmate.entity.Member;
import com.tripmate.repository.AccompanyApplicationRepository;
import com.tripmate.repository.AccompanyPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccompanyApplicationService {

    private final AccompanyApplicationRepository applicationRepository;
    private final AccompanyPostRepository postRepository;

    // 내가 작성한 게시글들의 신청자 수와 함께 조회
    public List<AccompanyApplicationResponses.PostWithApplications> getMyPostsWithApplications(Long memberId) {
        // 내가 작성한 게시글들 조회
        List<AccompanyPost> myPosts = postRepository.findByAuthorIdOrderByCreatedAtDesc(memberId);
        
        // 각 게시글의 신청자 수 조회
        List<Object[]> countResults = applicationRepository.countApplicationsByPostIds(
            myPosts.stream().map(AccompanyPost::getId).collect(Collectors.toList())
        );
        
        Map<Long, Long> applicationCounts = countResults.stream()
            .collect(Collectors.toMap(
                result -> (Long) result[0],
                result -> (Long) result[1]
            ));
        
        return myPosts.stream()
            .map(post -> AccompanyApplicationResponses.PostWithApplications.of(
                post, 
                applicationCounts.getOrDefault(post.getId(), 0L).intValue()
            ))
            .collect(Collectors.toList());
    }

    // 특정 게시글의 신청자 목록 조회
    public List<AccompanyApplicationResponses.ApplicationItem> getApplicationsByPostId(Long postId, Long memberId) {
        // 게시글 작성자인지 확인
        AccompanyPost post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        if (!post.getAuthor().getId().equals(memberId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        // 신청자 목록 조회
        List<AccompanyApplication> applications = applicationRepository.findByPostId(postId);
        
        return applications.stream()
            .map(AccompanyApplicationResponses.ApplicationItem::of)
            .collect(Collectors.toList());
    }

    // 신청 상태 업데이트 (수락/거절)
    @Transactional
    public void updateApplicationStatus(Long applicationId, Long memberId, String status) {
        AccompanyApplication application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("신청을 찾을 수 없습니다."));
        
        // 게시글 작성자인지 확인
        if (!application.getPost().getAuthor().getId().equals(memberId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        // 상태 업데이트
        if ("ACCEPTED".equals(status)) {
            application.accept();
        } else if ("REJECTED".equals(status)) {
            application.reject();
        } else {
            throw new IllegalArgumentException("유효하지 않은 상태입니다.");
        }
        
        applicationRepository.save(application);
    }

    // 특정 게시글에 대한 내 신청 상태 확인
    public boolean checkMyApplication(Long postId, Long memberId) {
        AccompanyPost post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        Member applicant = new Member();
        applicant.setId(memberId);
        
        return applicationRepository.existsByPostAndApplicant(post, applicant);
    }
}