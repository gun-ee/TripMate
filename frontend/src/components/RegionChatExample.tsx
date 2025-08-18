import React, { useState } from 'react';
import RegionChatModal from './RegionChatModal';

const RegionChatExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('japan');
  const [selectedCity, setSelectedCity] = useState('오사카');

  const regions = [
    {
      id: 'japan',
      name: '일본',
      cities: ['오사카', '도쿄', '후쿠오카', '삿포로']
    },
    {
      id: 'korea',
      name: '대한민국',
      cities: ['서울', '부산', '강원도', '경주']
    },
    {
      id: 'southeast',
      name: '동남아',
      cities: ['미얀마', '라오스', '베트남', '태국', '대만']
    },
    {
      id: 'europe',
      name: '유럽',
      cities: ['독일', '스페인', '영국', '이탈리아', '체코', '프랑스']
    }
  ];

  const openChat = (region: string, city: string) => {
    setSelectedRegion(region);
    setSelectedCity(city);
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>지역별 채팅방 예시</h1>
      <p>아래 지역을 클릭하여 채팅방을 열어보세요:</p>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {regions.map((region) => (
          <div key={region.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
            <h3>{region.name}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {region.cities.map((city) => (
                <button
                  key={city}
                  onClick={() => openChat(region.id, city)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #26a69a',
                    borderRadius: '20px',
                    background: 'white',
                    color: '#26a69a',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#26a69a';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#26a69a';
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RegionChatModal */}
      <RegionChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        region={selectedRegion}
        city={selectedCity}
      />
    </div>
  );
};

export default RegionChatExample;

