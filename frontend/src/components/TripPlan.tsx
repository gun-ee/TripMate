import React, { useState, useEffect } from 'react';
import Header from './Header';
import { tripPlanApi } from '../api/tripPlan';
import type { TripPlan, TripPlanResponse } from '../types/tripPlan';
import { useAuth } from '../contexts/AuthContext';
import { showDeleteConfirm } from '../utils/sweetAlert';
import './TripPlan.css';
import { FiMapPin, FiCalendar } from 'react-icons/fi';

// TripPlanData 인터페이스는 더 이상 필요하지 않으므로 제거

const TripPlanPage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [tripPlan, setTripPlan] = useState<TripPlan>({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    activities: [''],
    budget: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userTripPlans, setUserTripPlans] = useState<TripPlanResponse[]>([]);
  const [showPlanList, setShowPlanList] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTripPlan(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActivityChange = (index: number, value: string) => {
    const newActivities = [...tripPlan.activities];
    newActivities[index] = value;
    setTripPlan(prev => ({
      ...prev,
      activities: newActivities
    }));
  };

  const addActivity = () => {
    setTripPlan(prev => ({
      ...prev,
      activities: [...prev.activities, '']
    }));
  };

  const removeActivity = (index: number) => {
    if (tripPlan.activities.length > 1) {
      const newActivities = tripPlan.activities.filter((_, i) => i !== index);
      setTripPlan(prev => ({
        ...prev,
        activities: newActivities
      }));
    }
  };

  // 사용자의 여행 계획 목록 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserTripPlans();
    }
  }, [isLoggedIn]);

  const fetchUserTripPlans = async () => {
    try {
      const plans = await tripPlanApi.getUserTripPlans();
      setUserTripPlans(plans);
    } catch (error) {
      console.error('여행 계획 목록 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      if (tripPlan.id) {
        // 기존 계획 수정
        await tripPlanApi.updateTripPlan({
          id: tripPlan.id,
          title: tripPlan.title,
          destination: tripPlan.destination,
          startDate: tripPlan.startDate,
          endDate: tripPlan.endDate,
          description: tripPlan.description,
          activities: tripPlan.activities.filter(activity => activity.trim() !== ''),
          budget: tripPlan.budget
        });
        setMessage('여행 계획이 수정되었습니다.');
      } else {
        // 새 계획 생성
        const newPlan = await tripPlanApi.createTripPlan({
          title: tripPlan.title,
          destination: tripPlan.destination,
          startDate: tripPlan.startDate,
          endDate: tripPlan.endDate,
          description: tripPlan.description,
          activities: tripPlan.activities.filter(activity => activity.trim() !== ''),
          budget: tripPlan.budget
        });
        setTripPlan(newPlan);
        setMessage('새로운 여행 계획이 생성되었습니다.');
      }
      
      setIsEditing(false);
      fetchUserTripPlans(); // 목록 새로고침
    } catch (error) {
      console.error('여행 계획 저장 실패:', error);
      setMessage('여행 계획 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 원래 데이터로 복원
    if (tripPlan.id) {
      const originalPlan = userTripPlans.find(plan => plan.id === tripPlan.id);
      if (originalPlan) {
        setTripPlan(originalPlan);
      }
    }
  };

  const handleNewPlan = () => {
    setTripPlan({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      description: '',
      activities: [''],
      budget: 0
    });
    setIsEditing(false);
    setIsLanding(true);
    setShowPlanList(false);
  };

  const handleSelectPlan = (plan: TripPlanResponse) => {
    setTripPlan(plan);
    setIsEditing(false);
    setShowPlanList(false);
  };

  const handleDeletePlan = async (id: number) => {
    const result = await showDeleteConfirm('여행 계획 삭제', '정말로 이 여행 계획을 삭제하시겠습니까?');
    if (result.isConfirmed) {
      try {
        await tripPlanApi.deleteTripPlan(id);
        setMessage('여행 계획이 삭제되었습니다.');
        fetchUserTripPlans();
        
        // 현재 선택된 계획이 삭제된 경우 초기화
        if (tripPlan.id === id) {
          setTripPlan({
            title: '',
            destination: '',
            startDate: '',
            endDate: '',
            description: '',
            activities: [''],
            budget: 0
          });
        }
      } catch (error) {
        console.error('여행 계획 삭제 실패:', error);
        setMessage('여행 계획 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="trip-plan-container">
      <Header />
      <div className="trip-plan-content">
        <div className="trip-plan-header">
          <h1>{isLanding ? '새로운 여행 계획하기' : '여행 계획 만들기'}</h1>
          <p>{isLanding ? '어디로 떠나시나요? 날짜를 선택하고 계획을 시작하세요.' : '당신의 완벽한 여행을 계획해보세요'}</p>
          
          {!isLoggedIn && (
            <div className="login-notice">
              <p>여행 계획을 만들려면 로그인이 필요합니다.</p>
            </div>
          )}
          
          {isLoggedIn && !isLanding && (
            <div className="header-actions">
              <button 
                className="new-plan-btn"
                onClick={handleNewPlan}
              >
                + 새 여행 계획
              </button>
              <button 
                className="view-plans-btn"
                onClick={() => setShowPlanList(!showPlanList)}
              >
                내 여행 계획 보기
              </button>
            </div>
          )}
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`message ${message.includes('실패') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* 랜딩 폼 */}
        {isLanding && (
          <div className="landing-card">
            <div className="landing-form">
              <div className="landing-field">
                <label className="landing-label"><FiMapPin /> 어디로?</label>
                <input
                  type="text"
                  name="destination"
                  value={tripPlan.destination}
                  onChange={handleInputChange}
                  placeholder="예: 파리, 하와이, 일본"
                  className="landing-input"
                />
              </div>
              <div className="landing-row">
                <div className="landing-field">
                  <label className="landing-label"><FiCalendar /> 시작 날짜</label>
                  <input
                    type="date"
                    name="startDate"
                    value={tripPlan.startDate}
                    onChange={handleInputChange}
                    className="landing-input"
                  />
                </div>
                <div className="landing-field">
                  <label className="landing-label"><FiCalendar /> 종료 날짜</label>
                  <input
                    type="date"
                    name="endDate"
                    value={tripPlan.endDate}
                    onChange={handleInputChange}
                    className="landing-input"
                  />
                </div>
              </div>

              <div className="landing-actions">
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (!tripPlan.destination.trim()) {
                      setMessage('계획을 시작할 목적지를 선택하세요.');
                      return;
                    }
                    if (!tripPlan.title?.trim()) {
                      setTripPlan(prev => ({ ...prev, title: `${prev.destination} 여행` }));
                    }
                    setIsLanding(false);
                    setIsEditing(true);
                  }}
                >
                  계획 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 사용자의 여행 계획 목록 */}
        {!isLanding && showPlanList && userTripPlans.length > 0 && (
          <div className="user-plans-list">
            <h3>내 여행 계획 목록</h3>
            <div className="plans-grid">
              {userTripPlans.map((plan) => (
                <div key={plan.id} className="plan-item">
                  <h4>{plan.title}</h4>
                  <p><strong>목적지:</strong> {plan.destination}</p>
                  <p><strong>기간:</strong> {plan.startDate} ~ {plan.endDate}</p>
                  <div className="plan-actions">
                    <button 
                      className="select-plan-btn"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      선택
                    </button>
                    <button 
                      className="delete-plan-btn"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLanding && (!isEditing ? (
          <div className="trip-plan-display">
            <div className="plan-card">
              <h2>{tripPlan.title || '여행 계획 제목'}</h2>
              <div className="plan-info">
                <p><strong>목적지:</strong> {tripPlan.destination || '미정'}</p>
                <p><strong>기간:</strong> {tripPlan.startDate || '미정'} ~ {tripPlan.endDate || '미정'}</p>
                <p><strong>예산:</strong> {tripPlan.budget ? `${tripPlan.budget.toLocaleString()}원` : '미정'}</p>
                <p><strong>설명:</strong> {tripPlan.description || '여행 계획을 작성해주세요'}</p>
              </div>
              {tripPlan.activities.length > 0 && tripPlan.activities[0] && (
                <div className="plan-activities">
                  <h3>계획된 활동</h3>
                  <ul>
                    {tripPlan.activities.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button className="edit-btn" onClick={handleEdit}>
                계획 수정하기
              </button>
            </div>
          </div>
        ) : (
          <form className="trip-plan-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">여행 계획 제목 *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={tripPlan.title}
                onChange={handleInputChange}
                placeholder="여행 계획의 제목을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="destination">목적지 *</label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={tripPlan.destination}
                onChange={handleInputChange}
                placeholder="여행할 도시나 국가를 입력하세요"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">시작일 *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={tripPlan.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">종료일 *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={tripPlan.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">여행 설명</label>
              <textarea
                id="description"
                name="description"
                value={tripPlan.description}
                onChange={handleInputChange}
                placeholder="여행에 대한 자세한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget">예산 (원)</label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={tripPlan.budget}
                onChange={handleInputChange}
                placeholder="예상 예산을 입력하세요"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>계획된 활동</label>
              {tripPlan.activities.map((activity, index) => (
                <div key={index} className="activity-input-group">
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => handleActivityChange(index, e.target.value)}
                    placeholder={`활동 ${index + 1}을 입력하세요`}
                  />
                  {tripPlan.activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(index)}
                      className="remove-activity-btn"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addActivity}
                className="add-activity-btn"
              >
                + 활동 추가
              </button>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-btn"
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : (tripPlan.id ? '계획 수정' : '계획 저장')}
              </button>
              <button type="button" onClick={handleCancel} className="cancel-btn">
                취소
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
};

export default TripPlanPage;
