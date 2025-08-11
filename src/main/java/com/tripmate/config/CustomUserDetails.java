package com.tripmate.config;

import com.tripmate.entity.Member;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

  private final Member member;

  public CustomUserDetails(Member member) {
    this.member = member;
  }

  public Long getMemberId() {
    return member.getId();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    // ex) ROLE_USER, ROLE_ADMIN
    return Collections.singleton(new SimpleGrantedAuthority(member.getRole().toString()));
  }

  @Override
  public String getPassword() {
    return member.getPassword(); // SOCIAL_LOGIN일 수도 있음
  }

  @Override
  public String getUsername() {
    return member.getEmail(); // 또는 member.getId().toString()
  }

}
