package com.tripmate.service;

import com.tripmate.dto.AccompanyPostResponses;
import com.tripmate.dto.AccompanyPostRequests;
import com.tripmate.dto.AccompanyApplicationDtos;
import com.tripmate.entity.*;
import com.tripmate.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

    public Page<AccompanyPostResponses.ListItem> listOpen(int page, int size) {
        return postRepo.findByStatus(AccompanyPost.Status.OPEN, PageRequest.of(page, size)).map(AccompanyPostResponses::of);
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
    }

    @Transactional
    public void reject(Long ownerId, Long applicationId) {
        var a = appRepo.findById(applicationId).orElseThrow();
        var p = a.getPost();
        if (!p.getAuthor().getId().equals(ownerId)) throw new IllegalStateException("NOT_OWNER");
        a.setStatus(AccompanyApplication.Status.REJECTED);
    }
}
