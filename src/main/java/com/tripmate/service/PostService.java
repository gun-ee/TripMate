package com.tripmate.service;

import com.tripmate.dto.PostCreateRequest;
import com.tripmate.dto.PostListResponse;
import com.tripmate.dto.LikeResponse;
import com.tripmate.entity.*;
import com.tripmate.repository.PostRepository;
import com.tripmate.repository.PostLikeRepository;
import com.tripmate.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PostService {
    
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    
    @Value("${snsImg.location}")
    private String snsImgLocation;
    
    // 게시글 작성
    @Transactional
    public PostListResponse createPost(PostCreateRequest request, Member author, MultipartFile image) {
        String imageUrl = null;
        
        if (image != null && !image.isEmpty()) {
            try {
                imageUrl = saveImage(image);
            } catch (IOException e) {
                log.error("이미지 업로드 실패", e);
                throw new RuntimeException("이미지 업로드에 실패했습니다.");
            }
        }
        
        Post post = Post.builder()
                .author(author)
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrl(imageUrl)
                .status(PostStatus.ACTIVE)
                .build();
        
        Post savedPost = postRepository.save(post);
        
        return convertToPostListResponse(savedPost, author.getId());
    }
    
    // 게시글 목록 조회 (페이지네이션)
    public Page<PostListResponse> getPosts(Pageable pageable, Long currentMemberId) {
        Page<Post> posts = postRepository.findByStatusOrderByCreatedAtDesc(PostStatus.ACTIVE, pageable);
        
        return posts.map(post -> convertToPostListResponse(post, currentMemberId));
    }
    
    // 게시글 상세 조회
    public PostListResponse getPostById(Long postId, Long currentMemberId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        return convertToPostListResponse(post, currentMemberId);
    }
    
    // 게시글 수정
    @Transactional
    public PostListResponse updatePost(Long postId, PostCreateRequest request, Member member) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        if (!post.getAuthor().getId().equals(member.getId())) {
            throw new RuntimeException("게시글을 수정할 권한이 없습니다.");
        }
        
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        
        return convertToPostListResponse(post, member.getId());
    }
    
    // 게시글 삭제
    @Transactional
    public void deletePost(Long postId, Member member) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        if (!post.getAuthor().getId().equals(member.getId())) {
            throw new RuntimeException("게시글을 삭제할 권한이 없습니다.");
        }
        
        post.setStatus(PostStatus.DELETED);
        postRepository.save(post);
    }
    
    // 좋아요 처리
    @Transactional
    public LikeResponse toggleLike(Long postId, Long memberId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        Member member = new Member(); // 실제로는 MemberService에서 조회
        member.setId(memberId);
        
        boolean isLiked = postLikeRepository.existsByPostIdAndMemberId(postId, memberId);
        
        if (isLiked) {
            // 좋아요 취소
            postLikeRepository.deleteByPostIdAndMemberId(postId, memberId);
            isLiked = false;
        } else {
            // 좋아요 추가
            PostLike postLike = PostLike.builder()
                    .post(post)
                    .member(member)
                    .build();
            postLikeRepository.save(postLike);
            isLiked = true;
        }
        
        int likeCount = post.getLikeCount();
        
        return LikeResponse.builder()
                .postId(postId)
                .likeCount(likeCount)
                .isLiked(isLiked)
                .build();
    }

    // 인기 게시글 조회 (최근 1일간 좋아요 많은 순)
    public List<PostListResponse> getTrendingPosts() {
        // 최근 1일간의 게시글 중 좋아요가 많은 순으로 5개 조회
        java.time.LocalDateTime oneDayAgo = java.time.LocalDateTime.now().minusDays(1);
        List<Post> trendingPosts = postRepository.findTrendingPosts(PostStatus.ACTIVE, oneDayAgo);
        
        return trendingPosts.stream()
                .limit(5) // 최대 5개까지만
                .map(post -> convertToPostListResponse(post, null)) // 로그인하지 않은 사용자도 볼 수 있도록
                .collect(Collectors.toList());
    }
    
    // 이미지 저장 (임시 구현)
    private String saveImage(MultipartFile image) throws IOException {
        // 실제로는 ImageService를 사용해야 함
        String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
        Path uploadPath = Paths.get(snsImgLocation);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(image.getInputStream(), filePath);
        
        return "/snsupload/" + fileName;
    }
    
    // DTO 변환
    private PostListResponse convertToPostListResponse(Post post, Long currentMemberId) {
        return PostListResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .authorName(post.getAuthor().getNickname()) // username 대신 nickname 사용
                .authorProfileImg(post.getAuthor().getProfileImg())
                .createdAt(post.getCreatedAt())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .isLikedByMe(post.isLikedByMember(currentMemberId))
                .build();
    }
}
