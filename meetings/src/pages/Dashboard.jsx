import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusSquare, Edit, Trash2, Upload, ClipboardList, Calendar, CalendarPlus, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MEETING_TYPES = [
  'préinstruction', 'information', "information et d'orientation",
  'sensibilisation', 'concertation', 'coordination', 'suivi',
  'suivi et coordination', 'planification', 'validation',
];

export default function Dashboard() {
  const { user, isAdmin, isPhotographer } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(isAdmin);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isPhotographer) {
      navigate('/meetings', { replace: true });
    }
  }, [isPhotographer, navigate]);

  if (isPhotographer) return null;

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let ignore = false;
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/stats/dashboard');
        if (!ignore) setStats(data);
      } catch {
        // Stats are optional — fall back gracefully
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchStats();
    return () => { ignore = true; };
  }, [isAdmin]);

  // ── Admin Dashboard ──
  if (isAdmin) {
    if (loading) return <LoadingSpinner fullPage />;

    return (
      <div className="page-container">
        <div className="page-header">
          <h1>{t('dashboard.admin_title')}</h1>
          <p className="text-muted">{t('dashboard.admin_subtitle')}</p>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.totalMeetings ?? '—'}</div>
            <div className="stat-label">{t('dashboard.total_meetings')}</div>
          </div>
          <div className="stat-card stat-card-success">
            <div className="stat-value">{stats?.upcomingMeetings ?? '—'}</div>
            <div className="stat-label">{t('dashboard.upcoming')}</div>
          </div>
          <div className="stat-card stat-card-warning">
            <div className="stat-value">{stats?.inProgressMeetings ?? '—'}</div>
            <div className="stat-label">{t('dashboard.in_progress')}</div>
          </div>
          <div className="stat-card stat-card-info">
            <div className="stat-value">{stats?.completedMeetings ?? '—'}</div>
            <div className="stat-label">{t('dashboard.completed')}</div>
          </div>
        </div>

        {/* Meetings by Type */}
        {stats?.byType && Object.keys(stats.byType).length > 0 && (
          <div className="section">
            <h2 className="section-title">{t('dashboard.meetings_by_type')}</h2>
            <div className="type-bar-grid">
              {MEETING_TYPES.filter((t) => stats.byType[t] != null).map((type) => (
                <div key={type} className="type-bar-item">
                  <div className="type-bar-label">{type}</div>
                  <div className="type-bar-track">
                    <div
                      className="type-bar-fill"
                      style={{ width: `${Math.min(100, (stats.byType[type] / Math.max(1, stats.totalMeetings)) * 100)}%` }}
                    />
                  </div>
                  <div className="type-bar-count">{stats.byType[type]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="section">
          <h2 className="section-title">{t('dashboard.recent_activity')}</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="activity-list">
              {stats.recentActivity.slice(0, 10).map((item, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {item.action === 'CREATED' ? <PlusSquare size={16} /> :
                     item.action === 'UPDATED' ? <Edit size={16} /> :
                     item.action === 'DELETED' ? <Trash2 size={16} /> :
                     item.action === 'UPLOAD' ? <Upload size={16} /> : <ClipboardList size={16} />}
                  </span>
                  <span className="activity-text">
                    <strong>{item.user || t('dashboard.system')}</strong>{' '}
                    {item.action?.toLowerCase()} {item.target || '—'}
                  </span>
                  <span className="activity-time">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">{t('dashboard.no_activity')}</p>
          )}
        </div>

        {/* Quick Links */}
        <div className="section">
          <h2 className="section-title">{t('dashboard.quick_actions')}</h2>
          <div className="dashboard-grid">
            <Link to="/meetings" className="dash-card">
              <div className="dash-card-icon"><Calendar size={32} /></div>
              <h3>{t('dashboard.all_meetings_title')}</h3>
              <p>{t('dashboard.all_meetings_desc')}</p>
            </Link>
            <Link to="/meetings/new" className="dash-card">
              <div className="dash-card-icon"><CalendarPlus size={32} /></div>
              <h3>{t('dashboard.new_meeting_title')}</h3>
              <p>{t('dashboard.new_meeting_desc')}</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular User Dashboard ──
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('dashboard.welcome')}{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="text-muted">{t('dashboard.welcome_subtitle')}</p>
      </div>

      <div className="dashboard-grid">
        <Link to="/meetings" className="dash-card">
          <div className="dash-card-icon"><Calendar size={32} /></div>
          <h3>{t('dashboard.view_meetings_title')}</h3>
          <p>{t('dashboard.view_meetings_desc')}</p>
        </Link>
        {!isPhotographer && (
          <Link to="/meetings/new" className="dash-card">
            <div className="dash-card-icon"><CalendarPlus size={32} /></div>
            <h3>{t('dashboard.create_meeting_title')}</h3>
            <p>{t('dashboard.create_meeting_desc')}</p>
          </Link>
        )}
        {!isPhotographer && (
          <Link to="/calendar" className="dash-card">
            <div className="dash-card-icon"><CalendarDays size={32} /></div>
            <h3>{t('dashboard.calendar_title')}</h3>
            <p>{t('dashboard.calendar_desc')}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
