package com.tripmate.service;

import com.tripmate.dto.AccompanyPostResponses;
import com.tripmate.dto.AccompanyPostRequests;
import com.tripmate.dto.AccompanyApplicationDtos;
import com.tripmate.entity.*;
import com.tripmate.repository.*;
import com.tripmate.constant.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccompanyService {

    private final AccompanyPostRepository postRepo;
    private final AccompanyApplicationRepository appRepo;
    private final TripRepository tripRepo;
    private final MemberRepository memberRepo;
    private final NotificationService notificationService;

    public Page<AccompanyPostResponses.ListItem> listOpen(int page, int size) {
        return postRepo.findByStatusWithNull(AccompanyPost.Status.OPEN, PageRequest.of(page, size)).map(AccompanyPostResponses::of);
    }

    public Page<AccompanyPostResponses.ListItem> listOpen(int page, int size, String keyword, String status, String sortBy) {
        // 정렬 설정
        Sort sort = getSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // 상태 필터
        AccompanyPost.Status statusFilter = getStatusFilter(status);
        
        // 검색 및 필터링 실행
        if (keyword != null && !keyword.trim().isEmpty()) {
            return postRepo.findByKeywordAndStatus(keyword.trim(), statusFilter, pageable).map(AccompanyPostResponses::of);
        } else {
            return postRepo.findByStatusWithNull(statusFilter, pageable).map(AccompanyPostResponses::of);
        }
    }

    private Sort getSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        
        return switch (sortBy.toUpperCase()) {
            case "OLDEST" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "TITLE" -> Sort.by(Sort.Direction.ASC, "title");
            case "LATEST" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    private AccompanyPost.Status getStatusFilter(String status) {
        if (status == null || status.equalsIgnoreCase("ALL")) {
            return null; // 모든 상태
        }
        
        return switch (status.toUpperCase()) {
            case "OPEN" -> AccompanyPost.Status.OPEN;
            case "CLOSED" -> AccompanyPost.Status.CLOSED;
            default -> null; // 기본값을 null로 변경 (모든 상태)
        };
    }

    public AccompanyPostResponses.Detail get(Long id) {
        var p = postRepo.findById(id).orElseThrow();
        return AccompanyPostResponses.toDetail(p);
    }

    @Transactional
    public Long create(Long authorId, AccompanyPostRequests.Create req) {
        Member author = memberRepo.findById(authorId).orElseThrow();
        Trip trip = tripRepo.findById(req.getTripId()).orElseThrow();
        var p = AccompanyPost.builder()
                .author(author)
                .trip(trip)
                .title(req.getTitle())
                .content(req.getContent())
                .status(AccompanyPost.Status.OPEN)
                .build();
        postRepo.save(p);
        return p.getId();
    }

    @Transactional
    public void update(Long authorId, Long postId, AccompanyPostRequests.Update req) {
        var p = postRepo.findById(postId).orElseThrow();
        if (!p.getAuthor().getId().equals(authorId)) throw new IllegalStateException("NOT_OWNER");
        p.setTitle(req.getTitle());
        p.setContent(req.getContent());
    }

    @Transactional
    public void delete(Long authorId, Long postId) {
        var p = postRepo.findById(postId).orElseThrow();
        if (!p.getAuthor().getId().equals(authorId)) throw new IllegalStateException("NOT_OWNER");
        postRepo.delete(p);
    }

    @Transactional
    public void close(Long authorId, Long postId) {
        var p = postRepo.findById(postId).orElseThrow();
        if (!p.getAuthor().getId().equals(authorId)) throw new IllegalStateException("NOT_OWNER");
        p.setStatus(AccompanyPost.Status.CLOSED);
    }

    public Page<AccompanyPostResponses.ListItem> myPosts(Long authorId, int page, int size) {
        Member author = memberRepo.findById(authorId).orElseThrow();
        return postRepo.findByAuthor(author, PageRequest.of(page, size)).map(AccompanyPostResponses::of);
    }

    @Transactional
    public void apply(Long applicantId, Long postId, AccompanyApplicationDtos.ApplyReq req) {
        Member applicant = memberRepo.findById(applicantId).orElseThrow();
        var p = postRepo.findById(postId).orElseThrow();
        if (p.getStatus() == AccompanyPost.Status.CLOSED) throw new IllegalStateException("CLOSED");
        if (p.getAuthor().getId().equals(applicantId)) throw new IllegalStateException("SELF_APPLY");
        if (appRepo.existsByPostAndApplicant(p, applicant)) throw new IllegalStateException("DUPLICATE");
        var a = AccompanyApplication.builder()
                .post(p)
                .applicant(applicant)
                .message(req.getMessage())
                .status(AccompanyApplication.Status.PENDING)
                .build();
        appRepo.save(a);
        
        // 게시글 작성자에게 알림 발송
        String message = String.format("%s님이 동행 신청을 했습니다.", applicant.getNickname());
        String linkUrl = String.format("/accompany/%d", postId);
        notificationService.notify(
            p.getAuthor(), 
            NotificationType.ACCOMPANY_APPLICATION, 
            message, 
            linkUrl, 
            a.getId()
        );
    }

    public List<AccompanyApplicationDtos.Item> listApplicationsForOwner(Long ownerId) {
        Member owner = memberRepo.findById(ownerId).orElseThrow();
        var myPosts = postRepo.findByAuthor(owner, PageRequest.of(0, 1000)).getContent();
        if (myPosts.isEmpty()) return List.of();
        return appRepo.findByPostIn(myPosts).stream().map(AccompanyApplicationDtos::of).toList();
    }

    public List<AccompanyApplicationDtos.Item> listApplicationsByPost(Long postId, Long ownerId) {
        var p = postRepo.findById(postId).orElseThrow();
        if (!p.getAuthor().getId().equals(ownerId)) throw new IllegalStateException("NOT_OWNER");
        return appRepo.findByPost(p).stream().map(AccompanyApplicationDtos::of).toList();
    }

    @Transactional
    public void accept(Long ownerId, Long applicationId) {
        var a = appRepo.findById(applicationId).orElseThrow();
        var p = a.getPost();
        if (!p.getAuthor().getId().equals(ownerId)) throw new IllegalStateException("NOT_OWNER");
        a.setStatus(AccompanyApplication.Status.ACCEPTED);
        
        // 신청자에게 수락 알림 발송
        String message = String.format("동행 신청이 수락되었습니다. (%s)", p.getTitle());
        String linkUrl = String.format("/accompany/%d", p.getId());
        notificationService.notify(
            a.getApplicant(), 
            NotificationType.ACCOMPANY_APPLICATION, 
            message, 
            linkUrl, 
            a.getId()
        );
    }

    @Transactional
    public void reject(Long ownerId, Long applicationId) {
        var a = appRepo.findById(applicationId).orElseThrow();
        var p = a.getPost();
        if (!p.getAuthor().getId().equals(ownerId)) throw new IllegalStateException("NOT_OWNER");
        a.setStatus(AccompanyApplication.Status.REJECTED);
        
        // 신청자에게 거절 알림 발송
        String message = String.format("동행 신청이 거절되었습니다. (%s)", p.getTitle());
        String linkUrl = String.format("/accompany/%d", p.getId());
        notificationService.notify(
            a.getApplicant(), 
            NotificationType.ACCOMPANY_APPLICATION, 
            message, 
            linkUrl, 
            a.getId()
        );
    }
}
