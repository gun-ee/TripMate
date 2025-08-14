export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  phone: string;
  profileImgFile?: File;
}

export interface AuthResponse {
  token: string;
  member: MemberDto;
}

export interface MemberDto {
  email: string;
  nickname: string;
  phone: string;
  profileImg?: string;
}

export interface SocialCheckRequest {
  email: string;
  provider: string;
}

export interface ResetPasswordRequest {
  email: string;
  phone: string;
  newPassword: string;
}

export interface FindIdRequest {
  nickname: string;
  phone: string;
}

export interface FindIdResponse {
  email: string;
}










