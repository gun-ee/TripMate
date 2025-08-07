package com.tripmate.entity.member;

import com.tripmate.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원 엔티티
 * 로컬 회원가입과 소셜 로그인을 모두 지원하는 회원 정보를 관리
 */
@Entity
@Table(name = "members")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 이메일 (로그인 ID로 사용)
     * 유니크 제약조건 적용
     */
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    /**
     * 닉네임
     */
    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    /**
     * 비밀번호 (소셜 로그인의 경우 null 허용)
     * PasswordEncoder로 암호화되어 저장
     */
    @Column(name = "password", length = 255)
    private String password;

    /**
     * 전화번호
     */
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    /**
     * 로그인 제공자 (local, google, kakao, naver)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private Provider provider;

    /**
     * 소셜 로그인 ID (소셜 로그인의 경우에만 사용)
     */
    @Column(name = "snsId", length = 100)
    private String snsId;

    /**
     * 프로필 이미지 경로
     */
    @Column(name = "profileImage", length = 500)
    private String profileImage;

    /**
     * 사용자 역할 (USER, ADMIN)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    /**
     * 로그인 제공자 enum
     */
    public enum Provider {
        LOCAL, GOOGLE, KAKAO, NAVER
    }

    /**
     * 회원 정보 수정 메서드
     */
    public void updateProfile(String nickname, String phone, String profileImage) {
        this.nickname = nickname;
        this.phone = phone;
        this.profileImage = profileImage;
    }

    /**
     * 비밀번호 변경 메서드
     */
    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    /**
     * 소셜 로그인 사용자 여부 확인
     */
    public boolean isSocialUser() {
        return this.provider != Provider.LOCAL;
    }

    /**
     * 소셜 로그인 사용자 여부 확인 (기존 코드 호환성)
     */
    public boolean isSocialLogin() {
        return "SOCIAL_LOGIN".equals(this.password);
    }
}
