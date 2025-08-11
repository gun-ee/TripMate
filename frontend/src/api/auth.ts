import axios from './axios';

export const authApi = {
  // 로그인
  login: async (data: any): Promise<any> => {
    const response = await axios.post('/api/login', data);
    return response.data;
  },

  // 회원가입
  signup: async (data: any): Promise<any> => {
    const formData = new FormData();
    
    // JSON 객체를 data 필드에 추가
    const memberData = {
      email: data.email,
      password: data.password,
      nickname: data.nickname,
      phone: data.phone
    };
    
    formData.append('data', new Blob([JSON.stringify(memberData)], {
      type: 'application/json'
    }));
    
    if (data.profileImgFile) {
      formData.append('profileImgFile', data.profileImgFile);
    }

    const response = await axios.post('/api/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 소셜 로그인 체크
  checkSocial: async (data: any): Promise<boolean> => {
    const response = await axios.post('/api/check-social', data);
    return response.data;
  },

  // 회원 정보 조회
  getMemberInfo: async (): Promise<any> => {
    console.log('📡 [auth.ts] getMemberInfo API 호출 시작');
    const response = await axios.get('/api/me');
    console.log('📡 [auth.ts] getMemberInfo API 응답:', response.data);
    return response.data;
  },

  // 닉네임 조회
  getNickname: async (email: string): Promise<string> => {
    const response = await axios.get(`/api/nickname?email=${email}`);
    return response.data;
  },

  // 역할 조회
  getRole: async (email: string): Promise<string> => {
    const response = await axios.get(`/api/role?email=${email}`);
    return response.data;
  },

  // 아이디 찾기
  findId: async (data: any): Promise<any> => {
    const response = await axios.post('/api/find-id', data);
    return response.data;
  },

  // 비밀번호 재설정
  resetPassword: async (data: any): Promise<void> => {
    await axios.post('/api/reset-password', data);
  },

  // 회원 정보 수정
  updateMember: async (data: FormData): Promise<any> => {
    const response = await axios.put('/api/update', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await axios.post('/api/logout');
  },
};
