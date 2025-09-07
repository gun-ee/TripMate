import React, { useEffect, useRef, useState } from 'react';
import { travelBotApi, type BotAnswer } from '../../api/travelBotApi';
import './TripMateBot.css';

type Msg = { role: 'bot' | 'user' | 'system'; text: string; ts: number };

const quickMenus = [
  { key: 'itinerary', label: '여행 일정 추천' },
  { key: 'budget', label: '여행 예산 계산' },
  { key: 'accompany', label: '동행 구하기' },
];

const faqButtons = [
  { key: 'usage', label: 'TripMate 사용법' },
  { key: 'accompany_how', label: '동행 구하기 방법' },
  { key: 'plan_how', label: '여행 일정 계획' },
  { key: 'triptalk_how', label: '트립톡 사용법' },
];

export default function TripMateBot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: '안녕하세요! TripMate 여행 도우미 챗봇입니다. 🧳\n\n여행 일정 추천, 예산 계산, 동행 구하기 등 다양한 여행 정보를 도와드릴게요!\n\n아래 메뉴를 선택하거나 궁금한 것을 자유롭게 물어보세요! ✈️', ts: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, loading]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput('');
    const userMsg: Msg = { role: 'user', text: q, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const ans: BotAnswer = await travelBotApi.ask(q);
      const chunks: string[] = [];
      if (ans.answer) chunks.push(ans.answer);
      if (ans.itinerary) chunks.push(formatItinerary(ans.itinerary));
      if (ans.items?.length) chunks.push('・관련 키워드: ' + ans.items.join(' · '));
      setMessages(prev => [...prev, { role: 'bot', text: chunks.join('\n\n'), ts: Date.now() }]);
      if (ans.suggestions?.length) {
        setMessages(prev => [...prev, { role: 'system', text: '추천 질문: ' + ans.suggestions.map(s=>'「'+s+'」').join('  '), ts: Date.now() }]);
      }
    } catch (e:any) {
      console.error('챗봇 API 에러:', e);
      let errorMessage = '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      
      if (e.response?.status === 500) {
        errorMessage = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      } else if (e.response?.status === 404) {
        errorMessage = 'API 서버를 찾을 수 없습니다. 관리자에게 문의하세요.';
      } else if (!e.response) {
        errorMessage = '네트워크 연결을 확인해 주세요.';
      }
      
      setMessages(prev => [...prev, { role: 'system', text: errorMessage, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const onMenu = (key: string) => {
    const prompts: Record<string, string> = {
      itinerary: '제주도 3박4일 여행 일정 추천해줘',
      budget: '제주도 3박4일 2인 예산 얼마나 들까?',
      accompany: '동행 구하기는 어떻게 해?',
    };
    send(prompts[key] || '');
  };

  const onFaqClick = (key: string) => {
    const faqAnswers: Record<string, string> = {
      usage: '📱 TripMate 사용법 안내\n\n' +
             '1️⃣ 회원가입 후 로그인하세요\n' +
             '2️⃣ 여행 일정 계획 메뉴에서 여행을 계획하세요\n' +
             '3️⃣ 동행구하기에서 같은 여행자를 찾아보세요\n' +
             '4️⃣ 트립톡에서 여행 정보를 공유하세요\n' +
             '5️⃣ 마이페이지에서 내 여행을 관리하세요\n\n' +
             '💡 더 자세한 도움이 필요하면 고객센터로 문의하세요!',
      accompany_how: '👥 동행 구하기 방법\n\n' +
                     '1. 동행구하기 메뉴 클릭\n' +
                     '2. 여행 일정 등록 (날짜, 지역, 인원)\n' +
                     '3. 상세 정보 작성 (여행 스타일, 관심사)\n' +
                     '4. 등록된 글에서 관심 있는 동행자 찾기\n' +
                     '5. 메시지로 연락 후 만남 약속\n\n' +
                     '⚠️ 안전을 위해 공개 장소에서 만나세요!',
      plan_how: '📅 여행 일정 계획 방법\n\n' +
                '1. 여행 일정 계획 메뉴 클릭\n' +
                '2. 여행지와 날짜 선택\n' +
                '3. 관심 있는 활동 선택\n' +
                '4. AI가 맞춤 일정을 추천해드려요\n' +
                '5. 일정을 저장하고 공유할 수 있어요\n\n' +
                '🎯 더 정확한 추천을 위해 상세 정보를 입력해주세요!',
      triptalk_how: '💬 트립톡 사용법\n\n' +
                    '1. 트립톡 메뉴에서 지역별 채팅방 참여\n' +
                    '2. 여행 정보와 팁을 공유하세요\n' +
                    '3. 실시간으로 현지 정보를 얻을 수 있어요\n' +
                    '4. 다른 여행자들과 소통하세요\n\n' +
                    '🌟 매너 있는 채팅으로 즐거운 여행 정보를 나누세요!',
    };
    
    const answer = faqAnswers[key];
    if (answer) {
      setMessages(prev => [...prev, { role: 'bot', text: answer, ts: Date.now() }]);
    }
  };

  const formatItinerary = (iti: any): string => {
    const days: string[] = [];
    for (const d of iti.days) {
      days.push(`Day ${d.day}: ` + d.plan.map((p:any)=>`${p.time} ${p.title}`).join(' → '));
    }
    return `여행 일정 제안\n${days.join('\n')}`;
  };

  return (
    <div className="bot-wrap">
      {/* 고정된 빠른 메뉴와 FAQ 버튼들 */}
      <div className="bot-quick-fixed">
        <div className="quick-title">빠른 메뉴</div>
        <div className="quick-buttons">
          {quickMenus.map(x=> <button key={x.key} onClick={()=>onMenu(x.key)} className="quick-btn">{x.label}</button>)}
        </div>
      </div>

      <div className="bot-faq-fixed">
        <div className="faq-title">자주 묻는 질문</div>
        <div className="faq-buttons">
          {faqButtons.map(x=> <button key={x.key} onClick={()=>onFaqClick(x.key)} className="faq-btn">{x.label}</button>)}
        </div>
      </div>

      {/* 답변 전용 영역 */}
      <div className="bot-messages">
        {messages.map((m, i)=>(
          <div key={m.ts+'-'+i} className={'msg '+m.role}><div className="bubble">{m.text}</div></div>
        ))}
        {loading && <div className="msg bot"><div className="bubble typing"><span/><span/><span/></div></div>}
        <div ref={endRef}/>
      </div>

      <div className="bot-input">
        <input
          placeholder="여행 질문을 입력..."
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if (e.key==='Enter') send(); }}
        />
        <button onClick={()=>send()}>질문</button>
      </div>
    </div>
  );
}
