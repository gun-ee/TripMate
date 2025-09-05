package com.tripmate.repository;

import com.tripmate.entity.AccompanyPost;
import com.tripmate.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccompanyPostRepository extends JpaRepository<AccompanyPost, Long> {
    Page<AccompanyPost> findByStatus(AccompanyPost.Status status, Pageable pageable);
    Page<AccompanyPost> findByAuthor(Member author, Pageable pageable);
}
