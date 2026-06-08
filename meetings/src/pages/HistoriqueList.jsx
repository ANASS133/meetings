import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HistoriqueList() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/historique');
      setHistory(data || []);
    } catch {
      showToast('Failed to load history list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePurge = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all archived history? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete('/api/historique/purge');
      showToast('All history records purged successfully', 'success');
      setHistory([]);
    } catch {
      showToast('Failed to purge history records', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Meeting History (Historique)</h1>
          <p className="text-muted">View all concluded, ended, and deleted meetings archive</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>No historical records</h3>
          <p>Meetings that are ended or deleted will appear here in the archive.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Objective</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time Range</th>
                <th>Duration</th>
                <th>Archived At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                  <Fragment key={h.id}>
                    <tr
                      onClick={() => navigate(`/historique/${h.id}`)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    >
                      <td style={{ fontWeight: '600' }}>
                        {h.objective || '—'}
                      </td>
                      <td>
                        <span className="type-tag">{h.type || '—'}</span>
                      </td>
                      <td>{h.objet || '—'}</td>
                      <td>{h.room || '—'}</td>
                      <td>{h.date || '—'}</td>
                      <td>
                        {h.startTime ? `${h.startTime} – ${h.endTime || ''}` : '—'}
                      </td>
                      <td>{h.durationMinutes ? `${h.durationMinutes} min` : '—'}</td>
                      <td>
                        {h.deletedAt ? new Date(h.deletedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
