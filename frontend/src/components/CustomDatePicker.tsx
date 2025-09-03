import React, { useState, useRef, useEffect } from 'react';
import './CustomDatePicker.css';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "날짜를 선택하세요",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value + 'T00:00:00') : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 마지막 날들
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // 다음 달의 첫 날들 (42개 셀을 채우기 위해)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onChange(formatDate(today));
    setIsOpen(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={`custom-date-picker ${className}`} ref={pickerRef}>
      <div 
        className="date-picker-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedDate ? 'selected-date' : 'placeholder'}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        <svg className="calendar-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </div>

      {isOpen && (
        <div className="date-picker-popup">
          <div className="date-picker-header">
            <button className="nav-button" onClick={handlePrevMonth}>
              ←
            </button>
            <div className="month-year">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </div>
            <button className="nav-button" onClick={handleNextMonth}>
              →
            </button>
          </div>

          <div className="date-picker-weekdays">
            {weekDays.map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="date-picker-days">
            {days.map((day, index) => (
              <button
                key={index}
                className={`day-button ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''} ${isSelected(day.date) ? 'selected' : ''}`}
                onClick={() => handleDateSelect(day.date)}
                disabled={!day.isCurrentMonth}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          <div className="date-picker-footer">
            <button className="today-button" onClick={handleToday}>
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
