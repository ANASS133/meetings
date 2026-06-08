import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, FileText, User, Tag, MessageSquare, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/api';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import './HistoriqueDetail.css';

export default function HistoriqueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/historique/${id}`);
        if (!ignore) setRecord(data);
      } catch {
        if (!ignore) {
          showToast('Historical record not found', 'error');
          navigate('/historique');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetch();
    return () => { ignore = true; };
  }, [id, navigate, showToast]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!record) return null;

  const parseNotes = (value, fallbackWriter) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ id: '1', writer: fallbackWriter, content: value }];
    }
  };

  const discussionList = parseNotes(record.discussion, 'Discussion');
  const recommendationList = parseNotes(record.recommendation, 'Recommendation');
  const taskList = parseNotes(record.tasks, 'Task');

  return (
    <div className="historique-detail-container">
      {/* Header */}
      <div className="historique-header-card">
        <Link to="/historique" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '0.9rem', transition: 'color 0.2s' }}>
          <ArrowLeft size={16} /> Back to History
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text)', margin: '0 0 16px 0', letterSpacing: '0.5px' }}>
          {record.objective || 'Untitled Meeting'}
        </h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(107, 114, 128, 0.2)', color: '#000000',
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <CheckCircle size={14} /> Archived
          </span>
          {record.type && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8',
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600'
            }}>
              <Tag size={14} />
              {record.type}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="historique-grid">
        {/* Left Column — Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Schedule Card */}
          <div className="historique-card">
            <h3 className="historique-card-title">
              <Calendar size={16} /> Schedule
            </h3>
            <div className="historique-info-list">
              <div className="historique-info-item">
                <div className="historique-info-icon"><Calendar size={18} /></div>
                <div className="historique-info-content">
                  <span className="historique-info-label">Date</span>
                  <span className="historique-info-value">{record.date || '—'}</span>
                </div>
              </div>
              <div className="historique-info-item">
                <div className="historique-info-icon"><Clock size={18} /></div>
                <div className="historique-info-content">
                  <span className="historique-info-label">Time & Duration</span>
                  <span className="historique-info-value">
                    {record.startTime && record.endTime ? `${record.startTime} – ${record.endTime}` : '—'} 
                    {record.durationMinutes ? ` (${record.durationMinutes} minutes)` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Context Card */}
          <div className="historique-card">
            <h3 className="historique-card-title">
              <FileText size={16} /> Location & Context
            </h3>
            <div className="historique-info-list">
              {record.room && (
                <div className="historique-info-item">
                  <div className="historique-info-icon"><MapPin size={18} /></div>
                  <div className="historique-info-content">
                    <span className="historique-info-label">Room</span>
                    <span className="historique-info-value">{record.room}</span>
                  </div>
                </div>
              )}
              {record.objet && (
                <div className="historique-info-item">
                  <div className="historique-info-icon"><FileText size={18} /></div>
                  <div className="historique-info-content">
                    <span className="historique-info-label">Objet</span>
                    <span className="historique-info-value">{record.objet}</span>
                  </div>
                </div>
              )}
              {record.description && (
                <div className="historique-info-item">
                  <div className="historique-info-icon"><FileText size={18} /></div>
                  <div className="historique-info-content">
                    <span className="historique-info-label">Description</span>
                    <span className="historique-info-value">{record.description}</span>
                  </div>
                </div>
              )}
              {record.dependences && (
                <div className="historique-info-item">
                  <div className="historique-info-icon"><FileText size={18} /></div>
                  <div className="historique-info-content">
                    <span className="historique-info-label">Dependences</span>
                    <span className="historique-info-value">{record.dependences}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* People Card */}
          <div className="historique-card">
            <h3 className="historique-card-title">
              <User size={16} /> People
            </h3>
            <div className="historique-info-list">
              {record.rapporteur && (
                <div className="historique-info-item">
                  <div className="historique-info-icon"><User size={18} /></div>
                  <div className="historique-info-content">
                    <span className="historique-info-label">Rapporteur</span>
                    <span className="historique-info-value">{record.rapporteur}</span>
                  </div>
                </div>
              )}
              {record.presidente && (
                <div className="historique-info-item">
                  <div className="historique-info-icon"><User size={18} /></div>
                  <div className="historique-info-content">
                    <span className="historique-info-label">Président(e)</span>
                    <span className="historique-info-value">{record.presidente}</span>
                  </div>
                </div>
              )}
              {!record.rapporteur && !record.presidente && (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No person assigned</span>
              )}
            </div>
          </div>
          
          {/* Archive Info */}
          <div className="historique-card">
            <h3 className="historique-card-title">
              <Clock size={16} /> Archive Info
            </h3>
            <div className="historique-info-list">
              <div className="historique-info-item">
                <div className="historique-info-icon"><Clock size={18} /></div>
                <div className="historique-info-content">
                  <span className="historique-info-label">Archived At</span>
                  <span className="historique-info-value">
                    {record.deletedAt ? new Date(record.deletedAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Discussions & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Discussions Card */}
          <div className="historique-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="historique-card-title">
              <MessageSquare size={16} /> Discussions ({discussionList.length})
            </h3>
            {discussionList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {discussionList.map((item, idx) => (
                  <div key={item.id || idx} className="historique-bubble discussion">
                    <span className="historique-bubble-author">
                      {item.writer || item.speaker || 'Speaker'}
                    </span>
                    <p className="historique-bubble-text">{item.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
                No discussions recorded
              </p>
            )}
          </div>


          {/* Tasks Card */}
          <div className="historique-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="historique-card-title">
              <CheckCircle size={16} /> Tasks ({taskList.length})
            </h3>
            {taskList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {taskList.map((item, idx) => (
                  <div key={item.id || idx} style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', borderLeft: `4px solid ${item.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{item.title || item.content}</span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{item.priority || 'MEDIUM'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status: {item.status || 'PENDING'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
                No tasks recorded
              </p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
