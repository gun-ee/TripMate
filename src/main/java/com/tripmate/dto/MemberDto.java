package com.tripmate.dto;

import com.tripmate.entity.Member;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MemberDto {
  private String email;
  private String nickname;
  private String phone;
  private String profileImg;

  public static MemberDto from(Member member) {
    MemberDto dto = new MemberDto();
    dto.setEmail(member.getEmail());
    dto.setNickname(member.getNickname());
    dto.setPhone(member.getPhone());
    dto.setProfileImg(member.getProfileImg());
    return dto;
  }
}
