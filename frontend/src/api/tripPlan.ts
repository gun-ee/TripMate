import axiosInstance from './axios';
import type { TripPlan, TripPlanCreateRequest, TripPlanUpdateRequest, TripPlanResponse } from '../types/tripPlan';

export const tripPlanApi = {
  // 여행 계획 생성
  createTripPlan: async (tripPlan: TripPlanCreateRequest): Promise<TripPlanResponse> => {
    const response = await axiosInstance.post('/trip-plans', tripPlan);
    return response.data;
  },

  // 여행 계획 조회
  getTripPlan: async (id: number): Promise<TripPlanResponse> => {
    const response = await axiosInstance.get(`/trip-plans/${id}`);
    return response.data;
  },

  // 사용자의 여행 계획 목록 조회
  getUserTripPlans: async (): Promise<TripPlanResponse[]> => {
    const response = await axiosInstance.get('/trip-plans/my');
    return response.data;
  },

  // 여행 계획 수정
  updateTripPlan: async (tripPlan: TripPlanUpdateRequest): Promise<TripPlanResponse> => {
    const response = await axiosInstance.put(`/trip-plans/${tripPlan.id}`, tripPlan);
    return response.data;
  },

  // 여행 계획 삭제
  deleteTripPlan: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/trip-plans/${id}`);
  },

  // 모든 여행 계획 조회 (공개용)
  getAllTripPlans: async (): Promise<TripPlanResponse[]> => {
    const response = await axiosInstance.get('/trip-plans');
    return response.data;
  }
};
