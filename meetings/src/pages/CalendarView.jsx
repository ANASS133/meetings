import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  const MONTHS = [
    t('calendar.months.jan'), t('calendar.months.feb'), t('calendar.months.mar'),
    t('calendar.months.apr'), t('calendar.months.may'), t('calendar.months.jun'),
    t('calendar.months.jul'), t('calendar.months.aug'), t('calendar.months.sep'),
    t('calendar.months.oct'), t('calendar.months.nov'), t('calendar.months.dec')
  ];
  
  const DAYS = [
    t('calendar.days.sun'), t('calendar.days.mon'), t('calendar.days.tue'),
    t('calendar.days.wed'), t('calendar.days.thu'), t('calendar.days.fri'),
    t('calendar.days.sat')
  ];

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const { isPhotographer } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPhotographer) {
      navigate('/dashboard', { replace: true });
    }
  }, [isPhotographer, navigate]);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = getDaysInMonth(year, month);
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const { data } = await api.get('/api/meetings', { params: { dateFrom: from, dateTo: to } });
      const list = Array.isArray(data) ? data : data.content || [];
      setMeetings(list);
    } catch {
      showToast(t('calendar.load_failed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [year, month, showToast]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  // Build meetings-by-date map
  const meetingsByDate = {};
  meetings.forEach((m) => {
    if (m.date) {
      const key = m.date; // "YYYY-MM-DD"
      if (!meetingsByDate[key]) meetingsByDate[key] = [];
      meetingsByDate[key].push(m);
    }
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const dateKey = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const dayMeetings = selectedDate ? (meetingsByDate[dateKey(selectedDate)] || []) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('calendar.title')}</h1>
        <div className="calendar-nav">
          <button className="btn-secondary" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span className="calendar-month-label">{MONTHS[month]} {year}</span>
          <button className="btn-secondary" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : (
        <div className="calendar-layout">
          <div className="calendar-grid-section">
            {/* Day headers */}
            <div className="calendar-grid">
              {DAYS.map((d) => (
                <div key={d} className="calendar-header-cell">{d}</div>
              ))}
              {cells.map((d, i) => (
                <div
                  key={i}
                  className={`calendar-cell ${d ? 'calendar-cell-active' : ''} ${d && isToday(d) ? 'calendar-cell-today' : ''} ${d && selectedDate === d ? 'calendar-cell-selected' : ''}`}
                  onClick={() => d && setSelectedDate(d)}
                >
                  {d && (
                    <>
                      <span className="calendar-day-number">{d}</span>
                      {meetingsByDate[dateKey(d)] && (
                        <div className="calendar-dots">
                          {meetingsByDate[dateKey(d)].slice(0, 3).map((_, j) => (
                            <span key={j} className="calendar-dot" />
                          ))}
                          {meetingsByDate[dateKey(d)].length > 3 && (
                            <span className="calendar-dot-more">+{meetingsByDate[dateKey(d)].length - 3}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Side panel: meetings for selected day */}
          <div className="calendar-sidebar">
            <h3>
              {selectedDate
                ? `${MONTHS[month]} ${selectedDate}, ${year}`
                : t('calendar.select_date')}
            </h3>
            {dayMeetings.length > 0 ? (
              <ul className="calendar-meeting-list">
                {dayMeetings.map((m) => (
                  <li key={m.id} className="calendar-meeting-item">
                    <div className="calendar-meeting-time">
                      {m.startTime || m.time || '—'}{m.endTime ? ` – ${m.endTime}` : ''}
                    </div>
                    <div>
                      <strong>{m.objective || m.title || t('calendar.untitled')}</strong>
                      {m.room && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{m.room}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">
                {selectedDate ? t('calendar.no_meetings') : t('calendar.click_date')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
