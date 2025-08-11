package com.tripmate.dto;

import com.tripmate.constant.Role;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MemberSearchDto {
  private Long id;
  private String email;
  private String nickname;
  private Role role;
}
