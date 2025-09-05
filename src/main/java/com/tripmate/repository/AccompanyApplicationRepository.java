package com.tripmate.repository;

import com.tripmate.entity.AccompanyApplication;
import com.tripmate.entity.AccompanyPost;
import com.tripmate.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccompanyApplicationRepository extends JpaRepository<AccompanyApplication, Long> {
    List<AccompanyApplication> findByPost(AccompanyPost post);
    List<AccompanyApplication> findByPostIn(Iterable<AccompanyPost> posts);
    boolean existsByPostAndApplicant(AccompanyPost post, Member applicant);
}
