import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';

import { Calendar, Clock, CheckCircle, XCircle, MapPin, Image as ImageIcon, Camera, Download, FileSpreadsheet, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MeetingsList() {
  const { t } = useTranslation();

  const MEETING_TYPES = [
    'préinstruction', 'information', "information et d'orientation",
    'sensibilisation', 'concertation', 'coordination', 'suivi',
    'suivi et coordination', 'planification', 'validation',
  ];

  const STATUS_OPTIONS = [
    { value: '', label: t('meetings_list.all_statuses') },
    { value: 'planned', label: t('meetings_list.planned') },
    { value: 'in_progress', label: t('meetings_list.in_progress') },
    { value: 'completed', label: t('meetings_list.completed') },
    { value: 'cancelled', label: t('meetings_list.cancelled') },
  ];

  const STATUS_BADGES = {
    planned: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {t('meetings_list.planned')}</span>,
    in_progress: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {t('meetings_list.in_progress')}</span>,
    completed: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> {t('meetings_list.completed')}</span>,
    cancelled: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> {t('meetings_list.cancelled')}</span>,
  };

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin, isPhotographer } = useAuth();
  const { showToast } = useToast();
  const [uploadingId, setUploadingId] = useState(null);
  
  // View media modal state
  const [viewingPhotosId, setViewingPhotosId] = useState(null);
  const [viewingPhotos, setViewingPhotos] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchMeetings = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/meetings', { params });
      const list = Array.isArray(data) ? data : data.content || [];
      setMeetings(list);
    } catch (err) {
      const message = err.response?.data?.message || t('meetings_list.load_failed');
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    fetchMeetings(params);
  };

  const handleReset = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    fetchMeetings();
  };

  const handleExport = async (format) => {
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/api/meetings/export', {
        params: { ...params, format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meetings.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`${t('meetings_list.export_success')} ${format.toUpperCase()}`, 'success');
    } catch {
      showToast(t('meetings_list.export_failed'), 'error');
    }
  };

  // Helper pour détecter si un fichier est une vidéo (par extension)
  const isVideoFile = (filename) => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleMediaUpload = async (meetingId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingId(meetingId);
    try {
      const promises = Array.from(files).map(file => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/meetings/${meetingId}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });
      await Promise.all(promises);
      showToast(`${files.length} média(s) ajouté(s) avec succès`, 'success');
    } catch (err) {
      showToast("Erreur lors de l'ajout des médias", 'error');
    } finally {
      setUploadingId(null);
      e.target.value = null;
    }
  };

  const handleViewMedia = async (meetingId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.get(`/api/meetings/${meetingId}/photos`);
      setViewingPhotos(Array.isArray(res.data) ? res.data : []);
      setViewingPhotosId(meetingId);
    } catch {
      showToast("Impossible de charger les médias", 'error');
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.title}>{t('meetings_list.title')}</h1>
        <div style={styles.headerActions}>
          {isAdmin && (
            <div style={styles.actionButtonsGroup}>
              <button style={styles.btnSecondary} onClick={() => handleExport('pdf')}><Download size={16} /> PDF</button>
              <button style={styles.btnSecondary} onClick={() => handleExport('excel')}><FileSpreadsheet size={16} /> Excel</button>
              <Link to="/meetings/new" style={styles.btnPrimary}>{t('meetings_list.new_meeting')}</Link>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} style={styles.filterBar}>
        <input
          type="text"
          style={styles.filterSearch}
          placeholder={t('meetings_list.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.filterSelect}>
          <option value="">{t('meetings_list.all_types')}</option>
          {MEETING_TYPES.map((tItem) => <option key={tItem} value={tItem}>{tItem}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={styles.filterSelect} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={styles.filterSelect} />
        <button type="submit" style={styles.btnPrimary}>{t('meetings_list.filter')}</button>
        <button type="button" style={styles.btnSecondary} onClick={handleReset}>{t('meetings_list.reset')}</button>
      </form>

      {/* Content */}
      {error && (
        <div style={styles.alertError}>
          <p>{error}</p>
          <button style={styles.btnLink} onClick={() => fetchMeetings()}>{t('meetings_list.try_again')}</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage />
      ) : meetings.length === 0 && !error ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}><ClipboardList size={48} strokeWidth={1.5} color="#999" /></div>
          <h3 style={styles.emptyStateTitle}>{t('meetings_list.no_meetings')}</h3>
          <p style={styles.emptyStateText}>{t('meetings_list.no_meetings_desc')}</p>
          {!isPhotographer && (
            <Link to="/meetings/new" style={styles.btnPrimary}>{t('meetings_list.create_meeting')}</Link>
          )}
        </div>
      ) : (
        <div style={styles.meetingsGrid}>
          {meetings.map((meeting) => {
            const isPhotoView = isPhotographer && !isAdmin;

            const CardContent = (
              <>
                <div style={styles.meetingCardHeader}>
                  <h3 style={styles.meetingCardTitle}>{meeting.objective || meeting.title || t('meetings_list.untitled')}</h3>
                  <span style={{...styles.statusBadge, ...getStatusBadgeStyle(meeting.status)}}>
                    {STATUS_BADGES[meeting.status] || meeting.status || t('meetings_list.planned')}
                  </span>
                </div>
                {!isPhotoView && meeting.description && <p style={styles.meetingDesc}>{meeting.description}</p>}
                <div style={styles.meetingMeta}>
                  {meeting.date && <span style={styles.metaItem}><Calendar size={14} /> {meeting.date}</span>}
                  {(meeting.startTime || meeting.time) && (
                    <span style={styles.metaItem}><Clock size={14} /> {meeting.startTime || meeting.time}{meeting.endTime ? ` - ${meeting.endTime}` : ''}</span>
                  )}
                  {(meeting.room || meeting.location) && <span style={styles.metaItem}><MapPin size={14} /> {meeting.room || meeting.location}</span>}
                </div>
                {meeting.type && <span style={styles.typeTag}>{meeting.type}</span>}
                
                {isPhotoView && (
                  <div style={styles.photographerActions} onClick={(e) => e.stopPropagation()}>
                    <button type="button" style={styles.btnSecondary} onClick={(e) => handleViewMedia(meeting.id, e)}>
                      <ImageIcon size={16} /> Voir les médias
                    </button>
                    <label style={{...styles.btnPrimary, cursor: 'pointer', opacity: uploadingId === meeting.id ? 0.6 : 1}}>
                      {uploadingId === meeting.id ? t('meetings_list.uploading') : <><Camera size={16} /> Ajouter des médias</>}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleMediaUpload(meeting.id, e)}
                        disabled={uploadingId === meeting.id}
                      />
                    </label>
                  </div>
                )}
              </>
            );

            if (isPhotoView) {
              return (
                <div key={meeting.id} style={styles.meetingCard}>
                  {CardContent}
                </div>
              );
            }

            return (
              <Link to={`/meetings/${meeting.id}`} key={meeting.id} style={{...styles.meetingCard, textDecoration: 'none', color: 'inherit'}}>
                {CardContent}
              </Link>
            );
          })}
        </div>
      )}

      {/* View Media Modal */}
      {viewingPhotosId && (
        <div style={styles.photoModalOverlay} onClick={() => setViewingPhotosId(null)}>
          <div style={styles.photoModal} onClick={e => e.stopPropagation()}>
            <div style={styles.photoModalHeader}>
              <h2 style={styles.photoModalTitle}>Médias de la réunion</h2>
              <button style={styles.photoModalClose} onClick={() => setViewingPhotosId(null)}>×</button>
            </div>
            {viewingPhotos.length > 0 ? (
              <div style={styles.photoGallery}>
                {viewingPhotos.map(p => {
                  const mediaUrl = `/uploads/${p.url}`;
                  const isVideo = isVideoFile(p.url);
                  
                  if (isVideo) {
                    return (
                      <div key={p.id} style={styles.mediaCard}>
                        <video controls style={styles.videoCard}>
                          <source src={mediaUrl} type={`video/${p.url.split('.').pop()}`} />
                          Votre navigateur ne supporte pas la lecture de vidéo.
                        </video>
                      </div>
                    );
                  }
                  
                  return (
                    <a key={p.id} href={mediaUrl} target="_blank" rel="noopener noreferrer" style={styles.photoCard}>
                      <img src={mediaUrl} alt="Média" style={styles.photoCardImage} />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p style={styles.photoEmpty}>Aucun média</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get status badge color
function getStatusBadgeStyle(status) {
  const baseStyle = { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' };
  
  switch(status) {
    case 'planned':
      return { ...baseStyle, backgroundColor: '#f0f0f0', color: '#333' };
    case 'in_progress':
      return { ...baseStyle, backgroundColor: '#e8e8e8', color: '#000' };
    case 'completed':
      return { ...baseStyle, backgroundColor: '#d9d9d9', color: '#000' };
    case 'cancelled':
      return { ...baseStyle, backgroundColor: '#cccccc', color: '#666' };
    default:
      return { ...baseStyle, backgroundColor: '#f0f0f0', color: '#333' };
  }
}

// Styles object - White and Black clean design
const styles = {
  pageContainer: {
    backgroundColor: '#ffffff',
    color: '#000000',
    minHeight: '100vh',
    padding: '0',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '32px 32px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    color: '#000000',
    letterSpacing: '-0.5px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  actionButtonsGroup: {
    display: 'flex',
    gap: '8px',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    padding: '24px 32px',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #e0e0e0',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterSearch: {
    flex: '1',
    minWidth: '200px',
    padding: '10px 14px',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#000000',
    outline: 'none',
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#000000',
    cursor: 'pointer',
    minWidth: '120px',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 18px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 18px',
    backgroundColor: '#f0f0f0',
    color: '#000000',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnLink: {
    background: 'none',
    border: 'none',
    color: '#000000',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    padding: '0',
  },
  alertError: {
    margin: '24px 32px',
    padding: '16px 20px',
    backgroundColor: '#fee0e0',
    border: '1px solid #ffa5a5',
    borderRadius: '6px',
    color: '#8b0000',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 32px',
    backgroundColor: '#ffffff',
  },
  emptyStateIcon: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#000000',
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#666666',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  meetingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    padding: '32px',
    backgroundColor: '#ffffff',
  },
  meetingCard: {
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  meetingCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
  },
  meetingCardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0',
    color: '#000000',
    flex: '1',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 12px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  meetingDesc: {
    fontSize: '14px',
    color: '#333333',
    margin: '8px 0 12px 0',
    lineHeight: '1.4',
  },
  meetingMeta: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    fontSize: '13px',
    color: '#666666',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  typeTag: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#e8e8e8',
    color: '#000000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  photographerActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
  },
  photoModalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
  },
  photoModal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  photoModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  photoModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0',
    color: '#000000',
  },
  photoModalClose: {
    fontSize: '28px',
    fontWeight: '300',
    border: 'none',
    background: 'none',
    color: '#000000',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px',
    padding: '24px',
  },
  photoCard: {
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #d0d0d0',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    display: 'block',
  },
  photoCardImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    display: 'block',
  },
  mediaCard: {
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #d0d0d0',
    transition: 'all 0.2s ease',
    display: 'block',
  },
  videoCard: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    display: 'block',
  },
  photoEmpty: {
    textAlign: 'center',
    padding: '40px 24px',
    color: '#999999',
    fontSize: '14px',
  },
};