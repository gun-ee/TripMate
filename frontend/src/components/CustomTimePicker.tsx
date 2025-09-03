import React, { useState, useRef, useEffect } from 'react';
import './CustomTimePicker.css';

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "시간을 선택하세요",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number } | null>(
    value ? parseTime(value) : null
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  function parseTime(timeString: string): { hour: number; minute: number } {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute };
  }

  function formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  function formatDisplayTime(hour: number, minute: number): string {
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    if (value) {
      setSelectedTime(parseTime(value));
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

  const handleTimeSelect = (hour: number, minute: number) => {
    setSelectedTime({ hour, minute });
    onChange(formatTime(hour, minute));
    setIsOpen(false);
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) {
      minutes.push(i);
    }
    return minutes;
  };

  const hours = generateHours();
  const minutes = generateMinutes();

  return (
    <div className={`custom-time-picker ${className}`} ref={pickerRef}>
      <div 
        className="time-picker-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedTime ? 'selected-time' : 'placeholder'}>
          {selectedTime ? formatDisplayTime(selectedTime.hour, selectedTime.minute) : placeholder}
        </span>
        <svg className="clock-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </div>

      {isOpen && (
        <div className="time-picker-popup">
          <div className="time-picker-header">
            <div className="time-display">
              {selectedTime && (
                <>
                  <div className="time-period">
                    {selectedTime.hour >= 12 ? '오후' : '오전'}
                  </div>
                  <div className="time-hour">
                    {selectedTime.hour === 0 ? 12 : selectedTime.hour > 12 ? selectedTime.hour - 12 : selectedTime.hour}
                  </div>
                  <div className="time-minute">
                    {selectedTime.minute.toString().padStart(2, '0')}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="time-picker-content">
            <div className="time-column">
              <div className="time-column-header">시</div>
              <div className="time-scroll-container">
                {hours.map(hour => (
                  <button
                    key={hour}
                    className={`time-option ${selectedTime?.hour === hour ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedTime) {
                        handleTimeSelect(hour, selectedTime.minute);
                      }
                    }}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-column">
              <div className="time-column-header">분</div>
              <div className="time-scroll-container">
                {minutes.map(minute => (
                  <button
                    key={minute}
                    className={`time-option ${selectedTime?.minute === minute ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedTime) {
                        handleTimeSelect(selectedTime.hour, minute);
                      }
                    }}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="time-picker-footer">
            <button 
              className="confirm-button"
              onClick={() => setIsOpen(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;
