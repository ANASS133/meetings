import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'cancelled'];
const STATUS_LABELS = { planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

export default function MeetingDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);



  useEffect(() => {
    let ignore = false;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/meetings/${id}`);
        if (!ignore) setMeeting(data);

        // Fetch tasks for this meeting
        try {
          const taskRes = await api.get(`/api/meetings/${id}/tasks`);
          if (!ignore) setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
        } catch {
          if (!ignore) setTasks([]);
        }

        // Fetch discussions for this meeting
        try {
          const discRes = await api.get(`/api/meetings/${id}/discussions`);
          if (!ignore) setDiscussions(Array.isArray(discRes.data) ? discRes.data : []);
        } catch {
          if (!ignore) setDiscussions([]);
        }

        // Fetch photos for this meeting
        try {
          const photoRes = await api.get(`/api/meetings/${id}/photos`);
          if (!ignore) setPhotos(Array.isArray(photoRes.data) ? photoRes.data : []);
        } catch {
          if (!ignore) setPhotos([]);
        }
      } catch {
        if (!ignore) {
          showToast('Failed to load meeting details', 'error');
          navigate('/meetings');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetch();
    return () => { ignore = true; };
  }, [id, navigate, showToast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/meetings/${id}`);
      showToast('Meeting deleted', 'success');
      navigate('/meetings');
    } catch {
      showToast('Failed to delete meeting', 'error');
      setDeleting(false);
      setDeleteOpen(false);
    }
  };



  const handleDeleteFile = async (fileId) => {
    try {
      await api.delete(`/api/documents/${fileId}`);
      setMeeting((prev) => ({
        ...prev,
        documents: (prev.documents || []).filter((d) => d.id !== fileId),
      }));
      showToast('Document removed', 'success');
    } catch {
      showToast('Failed to remove document', 'error');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!meeting) return null;

  const tabs = ['info', 'communes', 'participants', 'audience', 'documents', 'discussion', 'recommendations', 'photos'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/meetings" className="back-link">← Back to Meetings</Link>
          <h1>{meeting.objective || meeting.title || 'Meeting Details'}</h1>
          <div className="meeting-header-meta">
            <span className={`status-badge status-${meeting.status || 'planned'}`}>
              {STATUS_LABELS[meeting.status] || meeting.status || 'Planned'}
            </span>
            {meeting.type && <span className="type-tag">{meeting.type}</span>}
            <span>{meeting.date}</span>
            <span>{meeting.startTime} – {meeting.endTime}</span>
          </div>
        </div>
        <div className="header-actions">
          <Link
            to={`/meetings/${id}/live`}
            className="btn-primary"
            style={{ background: '#16a34a' }}
          >
            ▶ Start Meeting
          </Link>
          {isAdmin && (
            <>
              <Link to={`/meetings/${id}/edit`} className="btn-secondary">Edit</Link>
              <button className="btn-primary btn-danger" onClick={() => setDeleteOpen(true)}>Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="detail-section">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Objective</label>
                <p>{meeting.objective || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Type</label>
                <p>{meeting.type || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <p>{STATUS_LABELS[meeting.status] || meeting.status || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Date</label>
                <p>{meeting.date || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Time</label>
                <p>{meeting.startTime ? `${meeting.startTime} – ${meeting.endTime || ''}` : '—'}</p>
              </div>
              <div className="detail-item">
                <label>Room</label>
                <p>{meeting.room || meeting.location || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Objet</label>
                <p>{meeting.objet || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Dépendances</label>
                <p>{meeting.dependences || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Rapporteur</label>
                <p>{meeting.rapporteur || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Présidente / Président</label>
                <p>{meeting.presidente || '—'}</p>
              </div>
              {meeting.description && (
                <div className="detail-item detail-full">
                  <label>Description</label>
                  <p>{meeting.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Communes Tab */}
        {activeTab === 'communes' && (
          <div className="detail-section">
            {meeting.communes?.length > 0 ? (
              <ul className="entity-list">
                {meeting.communes.map((c, i) => (
                  <li key={i} className="entity-item">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No communes selected.</p>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="detail-section">
            {meeting.participants?.length > 0 ? (
              <ul className="entity-list">
                {meeting.participants.map((p) => (
                  <li key={p.id} className="entity-item">
                    {p.firstName} {p.lastName} {p.email && <span className="text-muted">({p.email})</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No participants assigned.</p>
            )}
          </div>
        )}

        {/* Audience Tab */}
        {activeTab === 'audience' && (() => {
          const audiences = meeting.audiences || meeting.audience || [];
          const internalServices = audiences.filter(a => a.description === 'service interne');
          const externalServices = audiences.filter(a => a.description === 'service externe');

          return (
            <div className="detail-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Services Internes ({internalServices.length})
                </h3>
                {internalServices.length > 0 ? (
                  <ul className="entity-list">
                    {internalServices.map((a) => (
                      <li key={a.id} className="entity-item">{a.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Aucun service interne assigné.</p>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Services Externes ({externalServices.length})
                </h3>
                {externalServices.length > 0 ? (
                  <ul className="entity-list">
                    {externalServices.map((a) => (
                      <li key={a.id} className="entity-item">{a.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Aucun service externe assigné.</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="detail-section">
            {meeting.documents?.length > 0 ? (
              <div className="file-grid">
                {meeting.documents.map((d) => {
                  const isImage = d.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
                  return (
                    <div key={d.id} className="file-card">
                      <div className="file-icon">{isImage ? '🖼️' : '📄'}</div>
                      <div className="file-name">{d.name || 'Document'}</div>
                      <div className="file-actions">
                        <a href={`/uploads/${d.url}`} target="_blank" rel="noopener noreferrer" className="btn-link">View</a>
                        {isAdmin && (
                          <button className="btn-link btn-link-danger" onClick={() => handleDeleteFile(d.id)}>Remove</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted">No documents uploaded.</p>
            )}
          </div>
        )}

        {/* Discussion Tab */}
        {activeTab === 'discussion' && (
          <div className="detail-section">
            {discussions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {discussions.map((item) => (
                  <div key={item.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: '#60a5fa', 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        👤 {item.speaker}
                      </span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ fontStyle: 'italic' }}>
                Aucune discussion ou débat enregistré pour le moment.
              </p>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (() => {
          let recommendationList = [];
          try {
            recommendationList = meeting.recommendation ? JSON.parse(meeting.recommendation) : [];
            if (!Array.isArray(recommendationList)) recommendationList = [];
          } catch {
            recommendationList = meeting.recommendation ? [{ id: '1', writer: 'Note', content: meeting.recommendation }] : [];
          }

          return (
            <div className="detail-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Tasks Table */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Tasks ({tasks.length})
                </h3>
                {tasks.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.9rem',
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                          <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee</th>
                          <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                          <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due</th>
                          <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{task.title}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {task.assignedToName || '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {task.priority && (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  letterSpacing: '0.03em',
                                  ...(task.priority === 'HIGH'
                                    ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444' }
                                    : task.priority === 'MEDIUM'
                                    ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }
                                    : { background: 'rgba(148,163,184,0.15)', color: '#94A3B8' })
                                }}>
                                  {task.priority}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {task.dueDate || '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                background: task.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: task.status === 'COMPLETED' ? '#10B981' : '#F59E0B',
                              }}>
                                {task.status === 'COMPLETED' ? '✓ Done' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                    No tasks assigned to this meeting.
                  </p>
                )}
              </div>

              {/* Recommendations */}

            </div>
          );
        })()}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="detail-section">
            {photos.length > 0 ? (
              <div className="photo-gallery photo-gallery-detail">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={`/uploads/${photo.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="photo-card"
                  >
                    <img
                      src={`/uploads/${photo.url}`}
                      alt="Meeting Photo"
                      className="photo-card-image"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="photo-empty">Aucune photo pour cette réunion.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}