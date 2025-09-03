import React, { useState } from 'react';
// @ts-expect-error - html2pdf.js has no type definitions
import html2pdf from 'html2pdf.js';
import QRCode from 'react-qr-code';
import { showToast } from '../utils/sweetAlert';

interface ItinStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags?: string;
  durationMin: number;
  arrive?: string;
  depart?: string;
  travelMin?: number;
  isLodging?: boolean;
}

interface PDFExportProps {
  days: ItinStop[][];
  cityQuery: string;
  startDate: string;
  endDate: string;
  dayStart: string;
  dayEnd: string;
}

const PDFExport: React.FC<PDFExportProps> = ({ 
  days, 
  cityQuery, 
  startDate, 
  endDate, 
  dayStart, 
  dayEnd 
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const formatTime = (timeStr: string) => {
    // 이미 HH:MM 형식으로 되어 있으면 그대로 반환
    if (timeStr && timeStr.includes(':')) {
      return timeStr;
    }
    // 분 단위 숫자인 경우 HH:MM으로 변환
    const minutes = parseInt(timeStr) || 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const generatePDF = async (showQR: boolean = false) => {
    // HTML 요소 생성
    const element = document.createElement('div');
    element.style.fontFamily = 'Noto Sans KR, Arial, sans-serif';
    element.style.padding = '20px';
    element.style.backgroundColor = 'white';
    element.style.color = '#333';
    
    // 총 일수 및 장소 수 계산
    const totalDays = days.length;
    const totalStops = days.reduce((sum, day) => sum + day.length, 0);
    
    // HTML 내용 생성
    element.innerHTML = `
      <div style="background: #26a69a; color: white; padding: 20px; margin: -20px -20px 20px -20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${cityQuery} 여행 계획</h1>
      </div>
      
      <div style="margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 5px 0; font-size: 14px;"><strong>여행 기간:</strong> ${startDate} ~ ${endDate}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>일과 시간:</strong> ${dayStart} ~ ${dayEnd}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>총 일수:</strong> ${totalDays}일, 총 방문 장소: ${totalStops}곳</p>
      </div>
      
      ${days.map((dayStops, dayIndex) => {
        if (dayStops.length === 0) return '';
        
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + dayIndex);
        const dateStr = dayDate.toLocaleDateString('ko-KR', { 
          month: 'long', 
          day: 'numeric', 
          weekday: 'short' 
        });
        
        return `
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h2 style="margin: 0; font-size: 20px; color: #1976d2;">${dayIndex + 1}일차 - ${dateStr}</h2>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #26a69a; color: white;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 8%;">순서</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 35%;">장소명</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 10%;">도착시간</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 10%;">출발시간</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 10%;">체류시간</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 10%;">이동시간</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 17%;">비고</th>
                </tr>
              </thead>
              <tbody>
                ${dayStops.map((stop, index) => `
                  <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: ${stop.isLodging ? '#e74c3c' : '#333'}; font-weight: ${stop.isLodging ? 'bold' : 'normal'};">${stop.name}${stop.isLodging ? ' [숙소]' : ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatTime(stop.arrive || '')}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatTime(stop.depart || '')}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stop.durationMin}분</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stop.travelMin ? stop.travelMin + '분' : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #666;">${stop.tags || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('')}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center;">
        <p>생성일: ${new Date().toLocaleDateString('ko-KR')} | TripMate - 여행 계획 도우미</p>
      </div>
    `;
    
    // html2pdf 옵션 설정
    const filename = `${cityQuery}_여행계획_${startDate}_${endDate}.pdf`;
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    
    if (showQR) {
      // QR 코드용 - 여행 계획 페이지 링크 생성
      const pageLink = `${window.location.origin}/trip/edit?id=${window.location.search.split('id=')[1]}`;
      setPdfUrl(pageLink);
      setShowQRModal(true);
    } else {
      // 일반 PDF 다운로드
      await html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', margin: '5px' }}>
        <button 
          className="pdf-export-btn" 
          onClick={() => generatePDF(false)}
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📄 PDF 다운로드
        </button>
        
        <button 
          onClick={() => generatePDF(true)}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📱 QR 코드 공유
        </button>
      </div>

      {/* QR 코드 모달 */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>QR 코드로 PDF 공유</h3>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <QRCode 
                value={pdfUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '20px',
              wordBreak: 'break-all'
            }}>
              QR 코드를 스캔하여 여행 계획 페이지에 접근하세요
            </p>
            
            <p style={{ 
              fontSize: '12px', 
              color: '#999', 
              marginBottom: '20px'
            }}>
              ※ 페이지 접근 후 "PDF 다운로드" 버튼을 눌러주세요<br/>
              배포된 서버에서만 다른 기기 접근 가능합니다
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pdfUrl);
                  showToast('링크가 클립보드에 복사되었습니다!');
                }}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 링크 복사
              </button>
              
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setPdfUrl('');
                }}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕ 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PDFExport;
