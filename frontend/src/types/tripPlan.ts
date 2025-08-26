export interface TripPlan {
  id?: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  activities: string[];
  budget: number;
  memberId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripPlanCreateRequest {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  activities: string[];
  budget: number;
}

export interface TripPlanUpdateRequest {
  id: number;
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  activities?: string[];
  budget?: number;
}

export interface TripPlanResponse {
  id: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  activities: string[];
  budget: number;
  memberId: number;
  memberNickname: string;
  createdAt: string;
  updatedAt: string;
}
