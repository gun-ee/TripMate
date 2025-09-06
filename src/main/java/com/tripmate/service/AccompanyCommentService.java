package com.tripmate.service;

import com.tripmate.dto.AccompanyCommentDtos;
import com.tripmate.entity.AccompanyComment;
import com.tripmate.entity.AccompanyPost;
import com.tripmate.entity.Member;
import com.tripmate.repository.AccompanyCommentRepository;
import com.tripmate.repository.AccompanyPostRepository;
import com.tripmate.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccompanyCommentService {

    private final AccompanyCommentRepository commentRepository;
    private final AccompanyPostRepository postRepository;
    private final MemberRepository memberRepository;

    // 댓글 목록 조회
    public AccompanyCommentDtos.ListResponse getCommentsByPostId(Long postId) {
        List<AccompanyComment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        long totalCount = commentRepository.countByPostIdAndIsDeletedFalse(postId);
        
        List<AccompanyCommentDtos.Response> commentDtos = comments.stream()
            .map(AccompanyCommentDtos.Response::of)
            .toList();
        
        return AccompanyCommentDtos.ListResponse.builder()
            .comments(commentDtos)
            .totalCount((int) totalCount)
            .build();
    }

    // 댓글 작성
    @Transactional
    public AccompanyCommentDtos.Response createComment(Long authorId, Long postId, AccompanyCommentDtos.Create request) {
        Member author = memberRepository.findById(authorId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        AccompanyPost post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        AccompanyComment comment = AccompanyComment.builder()
            .post(post)
            .author(author)
            .content(request.getContent())
            .isDeleted(false)
            .build();
        
        AccompanyComment savedComment = commentRepository.save(comment);
        return AccompanyCommentDtos.Response.of(savedComment);
    }

    // 댓글 수정
    @Transactional
    public AccompanyCommentDtos.Response updateComment(Long authorId, Long commentId, AccompanyCommentDtos.Update request) {
        AccompanyComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        
        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("댓글을 수정할 권한이 없습니다.");
        }
        
        if (comment.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 댓글은 수정할 수 없습니다.");
        }
        
        comment.setContent(request.getContent());
        AccompanyComment updatedComment = commentRepository.save(comment);
        return AccompanyCommentDtos.Response.of(updatedComment);
    }

    // 댓글 삭제 (soft delete)
    @Transactional
    public void deleteComment(Long authorId, Long commentId) {
        AccompanyComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        
        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("댓글을 삭제할 권한이 없습니다.");
        }
        
        if (comment.getIsDeleted()) {
            throw new IllegalArgumentException("이미 삭제된 댓글입니다.");
        }
        
        comment.setIsDeleted(true);
        commentRepository.save(comment);
    }
}
