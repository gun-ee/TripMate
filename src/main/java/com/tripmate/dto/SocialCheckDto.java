package com.tripmate.dto;

import com.tripmate.entity.Member;
import lombok.Getter;

@Getter
public class SocialCheckDto {
  private final String email;
  private final boolean isSocial;

  public SocialCheckDto(Member member) {
    this.email = member.getEmail();
    this.isSocial = "SOCIAL_LOGIN".equals(member.getPassword());
  }
}
