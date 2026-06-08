import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';

import { Calendar, Clock, CheckCircle, XCircle, MapPin, Image as ImageIcon, Camera, Download, FileSpreadsheet, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// MEETING_TYPES and STATUS_OPTIONS moved to component to use t()

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
  
  // View photos modal state
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

  const handlePhotoUpload = async (meetingId, e) => {
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
      showToast(`${files.length} photos ajoutées avec succès`, 'success');
    } catch (err) {
      showToast("Erreur lors de l'ajout des photos", 'error');
    } finally {
      setUploadingId(null);
      // clear the input so the same files can be selected again if needed
      e.target.value = null;
    }
  };

  const handleViewPhotos = async (meetingId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.get(`/api/meetings/${meetingId}/photos`);
      setViewingPhotos(Array.isArray(res.data) ? res.data : []);
      setViewingPhotosId(meetingId);
    } catch {
      showToast("Impossible de charger les photos", 'error');
    }
  };

  return (
    <div className={`page-container ${isPhotographer && !isAdmin ? 'photographer-space-bg' : ''}`}>
      <div className="page-header">
        <h1>{t('meetings_list.title')}</h1>
        <div className="header-actions">
          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleExport('pdf')}><Download size={16} /> PDF</button>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleExport('excel')}><FileSpreadsheet size={16} /> Excel</button>
              <Link to="/meetings/new" className="btn-primary">{t('meetings_list.new_meeting')}</Link>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="filter-bar">
        <input
          type="text"
          className="filter-search"
          placeholder={t('meetings_list.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">{t('meetings_list.all_types')}</option>
          {MEETING_TYPES.map((tItem) => <option key={tItem} value={tItem}>{tItem}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button type="submit" className="btn-primary btn-sm">{t('meetings_list.filter')}</button>
        <button type="button" className="btn-secondary btn-sm" onClick={handleReset}>{t('meetings_list.reset')}</button>
      </form>

      {/* Content */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button className="btn-link" onClick={() => fetchMeetings()}>{t('meetings_list.try_again')}</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage />
      ) : meetings.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}><ClipboardList size={48} strokeWidth={1.5} color="var(--color-text-muted)" /></div>
          <h3>{t('meetings_list.no_meetings')}</h3>
          <p>{t('meetings_list.no_meetings_desc')}</p>
          {!isPhotographer && (
            <Link to="/meetings/new" className="btn-primary">{t('meetings_list.create_meeting')}</Link>
          )}
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map((meeting) => {
            const isPhotoView = isPhotographer && !isAdmin;

            const CardContent = (
              <>
                <div className="meeting-card-header">
                  <h3>{meeting.objective || meeting.title || t('meetings_list.untitled')}</h3>
                  <span className={`status-badge status-${meeting.status || 'planned'}`}>
                    {STATUS_BADGES[meeting.status] || meeting.status || t('meetings_list.planned')}
                  </span>
                </div>
                {!isPhotoView && meeting.description && <p className="meeting-desc">{meeting.description}</p>}
                <div className="meeting-meta" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {meeting.date && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {meeting.date}</span>}
                  {(meeting.startTime || meeting.time) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {meeting.startTime || meeting.time}{meeting.endTime ? ` - ${meeting.endTime}` : ''}</span>
                  )}
                  {(meeting.room || meeting.location) && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {meeting.room || meeting.location}</span>}
                </div>
                {meeting.type && <span className="type-tag">{meeting.type}</span>}
                
                {isPhotoView && (
                  <div className="photographer-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="btn-secondary btn-sm" onClick={(e) => handleViewPhotos(meeting.id, e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <ImageIcon size={16} /> {t('meetings_list.view_photos')}
                    </button>
                    <label className={`btn-primary btn-upload-photo ${uploadingId === meeting.id ? 'loading' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {uploadingId === meeting.id ? t('meetings_list.uploading') : <><Camera size={16} /> {t('meetings_list.add_photos')}</>}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoUpload(meeting.id, e)}
                        disabled={uploadingId === meeting.id}
                      />
                    </label>
                  </div>
                )}
              </>
            );

            if (isPhotoView) {
              return (
                <div key={meeting.id} className="meeting-card photographer-card">
                  {CardContent}
                </div>
              );
            }

            return (
              <Link to={`/meetings/${meeting.id}`} key={meeting.id} className="meeting-card meeting-card-link">
                {CardContent}
              </Link>
            );
          })}
        </div>
      )}

      {/* View Photos Modal */}
      {viewingPhotosId && (
        <div className="photo-modal-overlay" onClick={() => setViewingPhotosId(null)}>
          <div className="photo-modal" onClick={e => e.stopPropagation()}>
            <div className="photo-modal-header">
              <h2>{t('meetings_list.photos_of_meeting')}</h2>
              <button className="photo-modal-close" onClick={() => setViewingPhotosId(null)}>×</button>
            </div>
            {viewingPhotos.length > 0 ? (
              <div className="photo-gallery">
                {viewingPhotos.map(p => (
                  <a key={p.id} href={`/uploads/${p.url}`} target="_blank" rel="noopener noreferrer" className="photo-card">
                    <img src={`/uploads/${p.url}`} alt="Photo" className="photo-card-image" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="photo-empty">{t('meetings_list.no_photos')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
