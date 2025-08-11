package com.tripmate.repository;

import com.tripmate.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(@Param("email") String email);

    Optional<Member> findByPhone(@Param("phone") String phone);

    Optional<Member> findByNickname(@Param("nickname") String nickname);
}
