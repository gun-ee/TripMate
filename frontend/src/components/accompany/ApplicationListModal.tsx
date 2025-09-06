import React, { useEffect, useState } from 'react';
import { accompanyApi, type ApplicationItem } from '../../api/accompany';
import Swal from 'sweetalert2';
import './Accompany.css';

interface Props {
  open: boolean;
  onClose: () => void;
  postId: number;
  postTitle: string;
}

export default function ApplicationListModal({ open, onClose, postId, postTitle }: Props) {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && postId) {
      fetchApplications();
    }
  }, [open, postId]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await accompanyApi.getApplicationsByPostId(postId);
      setApplications(data);
    } catch (error) {
      console.error('신청자 목록 로드 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '로드 실패',
        text: '신청자 목록을 불러올 수 없습니다.',
        confirmButtonText: '확인'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId: number, applicantName: string) => {
    const result = await Swal.fire({
      title: '신청 승인',
      text: `${applicantName}님의 신청을 승인하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '승인',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await accompanyApi.updateApplicationStatus(applicationId, 'ACCEPTED');
        Swal.fire({
          icon: 'success',
          title: '승인 완료',
          text: '신청이 승인되었습니다.',
          confirmButtonText: '확인'
        });
        fetchApplications(); // 목록 새로고침
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: '승인 실패',
          text: '신청 승인에 실패했습니다.',
          confirmButtonText: '확인'
        });
      }
    }
  };

  const handleReject = async (applicationId: number, applicantName: string) => {
    const result = await Swal.fire({
      title: '신청 거부',
      text: `${applicantName}님의 신청을 거부하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '거부',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await accompanyApi.updateApplicationStatus(applicationId, 'REJECTED');
        Swal.fire({
          icon: 'success',
          title: '거부 완료',
          text: '신청이 거부되었습니다.',
          confirmButtonText: '확인'
        });
        fetchApplications(); // 목록 새로고침
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: '거부 실패',
          text: '신청 거부에 실패했습니다.',
          confirmButtonText: '확인'
        });
      }
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>신청자 목록 - {postTitle}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p>아직 신청자가 없습니다.</p>
            </div>
          ) : (
            <div className="application-list">
              {applications.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <div className="applicant-info">
                      <div className="profile-image">
                        {app.profileImage ? (
                          <img src={app.profileImage} alt={app.applicantNickname} />
                        ) : (
                          <div className="default-avatar">👤</div>
                        )}
                      </div>
                      <div className="applicant-details">
                        <h4>{app.applicantNickname}</h4>
                        <p className="application-date">
                          {new Date(app.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`status-badge status-${app.status.toLowerCase()}`}>
                      {app.status === 'PENDING' && '대기중'}
                      {app.status === 'ACCEPTED' && '승인됨'}
                      {app.status === 'REJECTED' && '거부됨'}
                    </div>
                  </div>
                  
                  <div className="application-message">
                    <p>{app.message}</p>
                  </div>
                  
                  {app.status === 'PENDING' && (
                    <div className="application-actions">
                      <button 
                        className="btn-accept"
                        onClick={() => handleAccept(app.id, app.applicantNickname)}
                      >
                        승인
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleReject(app.id, app.applicantNickname)}
                      >
                        거부
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
