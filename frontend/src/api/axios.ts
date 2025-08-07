import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API 응답 데이터 타입 정의
 */
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  token?: string;
}

/**
 * 로그인 응답 타입 정의
 */
interface LoginResponse {
  token: string;
  message?: string;
}

/**
 * 회원 정보 타입 정의
 */
interface MemberData {
  id: number;
  email: string;
  nickname: string;
  phone: string;
  profileImage?: string;
  provider?: string;
  snsId?: string;
}

/**
 * Axios 인스턴스 생성
 * React devServer proxy 설정을 통해 Spring Boot 백엔드와 연결
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api', // React devServer proxy 설정을 사용하면 Spring Boot로 연결됨
  withCredentials: true, // 쿠키 인증 필요 시 사용
});

/**
 * 요청 인터셉터: 토큰 자동 추가 및 FormData 처리
 * 모든 HTTP 요청 전에 실행되어 인증 토큰을 자동으로 추가
 */
axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
  // 로컬 스토리지에서 토큰 가져오기 (token 또는 accessToken 키 확인)
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  
  if (token) {
    // AxiosHeaders 객체인지 확인하여 안전하게 헤더 설정
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      // 일반 객체인 경우 헤더 직접 설정
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동으로 설정)
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  // 요청 로그 출력 (개발 환경에서 디버깅용)
  console.log('📡 axios 요청:', config.method?.toUpperCase(), config.url, config);
  
  return config;
});

/**
 * 응답 인터셉터: 성공 응답 및 에러 처리
 * 모든 HTTP 응답에 대해 공통 처리 로직 적용
 */
axiosInstance.interceptors.response.use(
  /**
   * 성공 응답 처리
   * 로그인 응답 시 토큰 자동 저장
   */
  (response: AxiosResponse) => {
    // 로그인 API 응답인지 확인
    if (
      response.config.url &&
      (response.config.url.endsWith('/members/login') ||
        response.config.url.endsWith('/api/members/login'))
    ) {
      // 로그인 성공 시 토큰을 로컬 스토리지에 저장
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('🔐 로그인 토큰이 저장되었습니다.');
      }
    }
    return response;
  },
  
  /**
   * 에러 응답 처리
   * 서버 에러 메시지 추출 및 콘솔 출력
   */
  (error: AxiosError) => {
    console.error('[Axios Error]', error.response || error);

    // 서버에서 보낸 에러 메시지가 있으면 그걸 사용
    if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      const errorData = error.response.data as { message: string };
      console.error('서버 에러:', errorData.message);
    } else {
      console.error('요청 처리 중 오류가 발생했습니다.');
    }

    return Promise.reject(error);
  }
);

/**
 * HTTP 메서드별 편의 함수들
 * 타입 안전성을 보장하는 API 호출 함수들
 */

/**
 * GET 요청 함수
 * @param url - 요청 URL
 * @param config - 추가 설정
 * @returns Promise<AxiosResponse<T>>
 */
export const apiGet = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return axiosInstance.get<T>(url, config);
};

/**
 * POST 요청 함수
 * @param url - 요청 URL
 * @param data - 요청 데이터
 * @param config - 추가 설정
 * @returns Promise<AxiosResponse<T>>
 */
export const apiPost = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return axiosInstance.post<T>(url, data, config);
};

/**
 * PUT 요청 함수
 * @param url - 요청 URL
 * @param data - 요청 데이터
 * @param config - 추가 설정
 * @returns Promise<AxiosResponse<T>>
 */
export const apiPut = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return axiosInstance.put<T>(url, data, config);
};

/**
 * DELETE 요청 함수
 * @param url - 요청 URL
 * @param config - 추가 설정
 * @returns Promise<AxiosResponse<T>>
 */
export const apiDelete = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return axiosInstance.delete<T>(url, config);
};

/**
 * PATCH 요청 함수
 * @param url - 요청 URL
 * @param data - 요청 데이터
 * @param config - 추가 설정
 * @returns Promise<AxiosResponse<T>>
 */
export const apiPatch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return axiosInstance.patch<T>(url, data, config);
};

// 기본 axios 인스턴스와 편의 함수들을 모두 export
export default axiosInstance; 