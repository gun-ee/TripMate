package com.tripmate.service;

import com.tripmate.dto.CommentRequest;
import com.tripmate.dto.CommentResponse;
import com.tripmate.entity.Comment;
import com.tripmate.entity.Member;
import com.tripmate.entity.Post;
import com.tripmate.repository.CommentRepository;
import com.tripmate.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    
    // 댓글 작성
    @Transactional
    public CommentResponse createComment(Long postId, CommentRequest request, Member author) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .content(request.getContent())
                .build();
        
        Comment savedComment = commentRepository.save(comment);
        
        return convertToCommentResponse(savedComment);
    }
    
    // 게시글의 댓글 목록 조회
    public List<CommentResponse> getCommentsByPostId(Long postId) {
        List<Comment> comments = commentRepository.findAllByPostIdOrderByCreatedAtAsc(postId);
        
        return comments.stream()
                .map(this::convertToCommentResponse)
                .collect(Collectors.toList());
    }
    
    // 댓글 수정
    @Transactional
    public CommentResponse updateComment(Long commentId, CommentRequest request, Member author) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        if (!comment.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("댓글을 수정할 권한이 없습니다.");
        }
        
        comment.setContent(request.getContent());
        
        return convertToCommentResponse(comment);
    }
    
    // 댓글 삭제
    @Transactional
    public void deleteComment(Long commentId, Member author) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        if (!comment.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("댓글을 삭제할 권한이 없습니다.");
        }
        
        commentRepository.delete(comment);
    }
    
    // DTO 변환
    private CommentResponse convertToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getAuthor().getNickname())
                .authorProfileImg(comment.getAuthor().getProfileImg())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
