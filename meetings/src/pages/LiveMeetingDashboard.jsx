import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleStop,
  Clock3,
  ListTodo,
  MapPin,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import api from '../api/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import './LiveMeetingDashboard.css';

// ── Helpers ──

function parseNotes(value, fallbackWriter) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [{ id: '1', writer: fallbackWriter, content: value }];
  }
}

function formatSeconds(totalSeconds) {
  if (totalSeconds == null || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatMinutes(minutes) {
  if (minutes == null || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Component ──

export default function LiveMeetingDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  const [participants, setParticipants] = useState([]);

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  // Live discussions list
  const [discussionList, setDiscussionList] = useState([]);

  // Form inputs
  const [discParticipantId, setDiscParticipantId] = useState('');
  const [discType, setDiscType] = useState('');
  const [discContent, setDiscContent] = useState('');

  // ── Participant management state ──
  const [allParticipants, setAllParticipants] = useState([]);
  const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const participantDropdownRef = useRef(null);

  // ── Dependency (past meeting context) ──
  const [dependencyMeeting, setDependencyMeeting] = useState(null);
  const [prevMeetingDrawerOpen, setPrevMeetingDrawerOpen] = useState(false);

  // ── Fetch meeting details ──

  const fetchMeeting = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/meetings/${id}`);
      setMeeting(data);

      if (data.participants) {
        setParticipants(
          data.participants.map((p) => ({
            id: p.id,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email,
            status: 'present',
          }))
        );
      }
    } catch {
      showToast('Impossible de charger la réunion', 'error');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // ── Fetch all available participants (for add dropdown) ──

  useEffect(() => {
    api.get('/api/participants')
      .then(({ data }) => setAllParticipants(Array.isArray(data) ? data : []))
      .catch(() => setAllParticipants([]));
  }, []);

  // ── Fetch dependent meeting from historique ──

  useEffect(() => {
    if (!meeting || !meeting.dependences) {
      setDependencyMeeting(null);
      return;
    }
    api.get('/api/historique/by-objective', { params: { objective: meeting.dependences } })
      .then(({ data }) => {
        // API returns a list; take the first (most recent) match
        const match = Array.isArray(data) && data.length > 0 ? data[0] : null;
        setDependencyMeeting(match);
      })
      .catch(() => setDependencyMeeting(null));
  }, [meeting]);

  // ── Close participant dropdown on outside click ──

  useEffect(() => {
    const handler = (e) => {
      if (participantDropdownRef.current && !participantDropdownRef.current.contains(e.target)) {
        setParticipantDropdownOpen(false);
        setParticipantSearch('');
      }
    };
    if (participantDropdownOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [participantDropdownOpen]);

  // ── Polling for live state (when IN_PROGRESS) ──

  useEffect(() => {
    if (!meeting || meeting.status !== 'in_progress') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/meetings/${id}`);
        setMeeting(data);
      } catch {
        // silent — polling can fail transiently
      }
    }, 1000); // poll every 1 second

    return () => clearInterval(interval);
  }, [id, meeting?.status]);

  // ── Fetch tasks ──

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/meetings/${id}/tasks`);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchTasks();
  }, [id, fetchTasks]);

  // ── Fetch discussions ──

  useEffect(() => {
    if (!id) return;
    const fetchDiscussions = async () => {
      try {
        const { data } = await api.get(`/api/meetings/${id}/discussions`);
        setDiscussionList(Array.isArray(data) ? data : []);
      } catch {
        setDiscussionList([]);
      }
    };
    fetchDiscussions();
  }, [id]);

  // ── Participant management handlers ──

  const handleAddParticipant = async (participant) => {
    // Optimistic update
    setParticipants((prev) => {
      if (prev.some((p) => p.id === participant.id)) return prev;
      return [...prev, {
        id: participant.id,
        name: `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email,
        status: 'present',
      }];
    });
    setParticipantDropdownOpen(false);
    setParticipantSearch('');

    try {
      await api.post(`/api/meetings/${id}/participants/${participant.id}`);
      showToast(`${participant.firstName} ${participant.lastName} ajouté`, 'success');
    } catch {
      showToast("Impossible d'ajouter le participant", 'error');
      // Rollback
      setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
    }
  };

  const handleRemoveParticipant = async (participant) => {
    // Optimistic update
    setParticipants((prev) => prev.filter((p) => p.id !== participant.id));

    try {
      await api.delete(`/api/meetings/${id}/participants/${participant.id}`);
      showToast(`${participant.name} retiré`, 'success');
    } catch {
      showToast('Impossible de retirer le participant', 'error');
      // Rollback
      setParticipants((prev) => [...prev, participant]);
      setParticipantDropdownOpen(false);
    }
  };

  // ── Discussion handlers ──

  const handleAddDiscussion = async () => {
    if (!discParticipantId) {
      showToast('Veuillez sélectionner un participant', 'error');
      return;
    }
    if (!discContent.trim()) {
      showToast('Veuillez saisir le contenu de la discussion', 'error');
      return;
    }

    try {
      const payload = {
        participantId: Number(discParticipantId),
        type: discType || null,
        content: discContent.trim(),
      };
      const { data } = await api.post(`/api/meetings/${id}/discussions`, payload);
      setDiscussionList((prev) => [data, ...prev]);
      setDiscContent('');
      setDiscType('');
      showToast('Discussion ajoutée', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || "Impossible d'ajouter la discussion", 'error');
    }
  };

  // ── Task handlers ──

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      showToast('Le titre de la tâche est obligatoire', 'error');
      return;
    }

    try {
      const payload = {
        title: newTaskTitle.trim(),
        assignedToId: newTaskAssignedTo ? Number(newTaskAssignedTo) : null,
        dueDate: newTaskDueDate || null,
        priority: newTaskPriority,
      };
      const { data } = await api.post(`/api/meetings/${id}/tasks`, payload);
      setTasks((prev) => [data, ...prev]);
      setNewTaskTitle('');
      setNewTaskAssignedTo('');
      setNewTaskDueDate('');
      setNewTaskPriority('MEDIUM');
      showToast('Tâche ajoutée', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || "Impossible d'ajouter la tâche", 'error');
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/api/meetings/${id}/tasks/${task.id}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch {
      showToast('Impossible de mettre à jour la tâche', 'error');
    }
  };

  const handleTogglePrevTask = async (taskIndex) => {
    if (!dependencyMeeting) return;
    const currentTasks = parseNotes(dependencyMeeting.tasks, 'Task');
    if (taskIndex < 0 || taskIndex >= currentTasks.length) return;

    const updatedTasks = currentTasks.map((t, idx) => {
      if (idx === taskIndex) {
        const taskObj = typeof t === 'string' ? { content: t } : t;
        return {
          ...taskObj,
          status: taskObj.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
        };
      }
      return t;
    });

    const serializedTasks = JSON.stringify(updatedTasks);

    try {
      await api.put(`/api/historique/${dependencyMeeting.id}`, {
        tasks: serializedTasks
      });

      setDependencyMeeting((prev) => ({
        ...prev,
        tasks: serializedTasks
      }));

      showToast('Statut de la tâche de la réunion précédente mis à jour', 'success');
    } catch {
      showToast('Impossible de mettre à jour la tâche de la réunion précédente', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/api/meetings/${id}/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Tâche supprimée', 'success');
    } catch {
      showToast('Impossible de supprimer la tâche', 'error');
    }
  };

  // ── Meeting control handlers ──

  const handleStart = async () => {
    try {
      const { data } = await api.post(`/api/meetings/${id}/start`);
      setMeeting(data);
    } catch {
      showToast('Impossible de démarrer la réunion', 'error');
    }
  };

  const handlePause = async () => {
    try {
      const { data } = await api.post(`/api/meetings/${id}/pause`);
      setMeeting(data);
    } catch {
      showToast('Impossible de mettre la réunion en pause', 'error');
    }
  };

  const handleResume = async () => {
    try {
      const { data } = await api.post(`/api/meetings/${id}/resume`);
      setMeeting(data);
    } catch {
      showToast('Impossible de reprendre la réunion', 'error');
    }
  };

  const handleEnd = async () => {
    try {
      const { data } = await api.post(`/api/meetings/${id}/end`);
      setMeeting(data);
      showToast('Réunion terminée', 'success');
      navigate('/dashboard');
    } catch {
      showToast('Impossible de terminer la réunion', 'error');
    }
  };

  // ── Render ──

  if (loading) return <LoadingSpinner fullPage />;
  if (!meeting) return null;

  const isLive = meeting.status === 'in_progress';
  const isPaused = meeting.isPaused;
  const elapsed = meeting.elapsedSeconds ?? 0;
  const planned = meeting.plannedDurationMinutes ?? 0;
  const finalDuration = meeting.finalDurationMinutes;
  
  const plannedSeconds = planned * 60;
  const isOvertime = isLive && plannedSeconds > 0 && elapsed > plannedSeconds;
  const displaySeconds = isLive 
    ? (isOvertime ? plannedSeconds : elapsed) 
    : (finalDuration != null ? finalDuration * 60 : plannedSeconds);
  const overtimeSeconds = isOvertime ? elapsed - plannedSeconds : 0;
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const pendingTasks = Math.max(tasks.length - completedTasks, 0);
  const statusLabel = isLive ? (isPaused ? 'En pause' : 'En direct') : meeting.status === 'completed' ? 'Terminée' : 'Planifiée';
  const statusClass = isLive ? (isPaused ? 'is-paused' : 'is-live') : meeting.status === 'completed' ? 'is-completed' : 'is-planned';

  return (
    <div className="live-dashboard-container">
      <header className="live-header">
        <div className="live-header-left">
          <div className="live-header-title-row">
            <h1>{meeting.objective || meeting.title || 'Réunion en direct'}</h1>
            <span className={`live-badge ${statusClass}`}>
              {isLive && !isPaused && (
                <span className="live-dot" />
              )}
              {statusLabel}
            </span>
          </div>
          <div className="live-header-meta">
            <span><CalendarDays size={14} /> {meeting.date || 'Date non définie'}</span>
            <span><Clock3 size={14} /> {meeting.startTime || '--:--'} - {meeting.endTime || '--:--'}</span>
            {meeting.room && <span><MapPin size={14} /> {meeting.room}</span>}
          </div>
        </div>
        <div className="live-header-actions">
          {isLive && (
            <button className="live-action-btn live-action-btn-danger" onClick={handleEnd}>
              <CircleStop size={16} /> Terminer la réunion
            </button>
          )}
          {!isLive && meeting.status === 'planned' && (
            <button className="live-action-btn live-action-btn-success" onClick={handleStart}>
              <Play size={16} /> Démarrer la réunion
            </button>
          )}
          {meeting.status === 'completed' && (
            <span className="live-completed-note">
              Durée finale : {formatMinutes(finalDuration)}
            </span>
          )}
        </div>
      </header>

      <main className="live-content">
        <section className="left-panel">
          <div className={`timer-section ${statusClass}`}>
            <div className="timer-header">
              <Zap size={14} />
              <span>{isLive ? (isPaused ? 'En pause' : 'En cours') : meeting.status === 'completed' ? 'Terminée' : 'Prévu'}</span>
              {isPaused && <span className="timer-paused-badge">Pause</span>}
            </div>
            <div className="timer-digital">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                <span className={`timer-time ${isOvertime ? 'is-frozen' : ''}`}>{formatSeconds(displaySeconds)}</span>
                {isOvertime && (
                  <span className="timer-time overtime-timer" style={{ fontSize: '1.75rem' }}>
                    +{formatSeconds(overtimeSeconds)}
                  </span>
                )}
              </div>
              <span className="timer-label">
                {isLive ? 'temps écoulé' : meeting.status === 'completed' ? 'durée finale' : 'durée prévue'}
              </span>
            </div>
            <div className="timer-stats">
              <div>
                <span>Prévu</span>
                <strong>{formatMinutes(planned)}</strong>
              </div>
              <div>
                <span>Participants</span>
                <strong>{participants.length}</strong>
              </div>
              <div>
                <span>Tâches ouvertes</span>
                <strong>{pendingTasks}</strong>
              </div>
            </div>
            <div className="timer-actions">
              {isLive && (
                <>
                  {isPaused ? (
                    <button className="timer-btn" onClick={handleResume}>
                      <Play size={14} /> Reprendre
                    </button>
                  ) : (
                    <button className="timer-btn" onClick={handlePause}>
                      <Pause size={14} /> Pause
                    </button>
                  )}
                </>
              )}
              {finalDuration != null && (
                <span className="timer-final">
                  Final : {formatMinutes(finalDuration)}
                </span>
              )}
            </div>
          </div>

          <div className="participants-section">
            <div className="section-header participants-header">
              <div className="section-title">
                <Users size={16} />
                <span>Participants ({participants.length})</span>
              </div>
              <button
                type="button"
                className="add-participant-btn"
                onClick={() => setParticipantDropdownOpen((prev) => !prev)}
                title="Ajouter un participant"
              >
                <UserPlus size={14} />
              </button>

              {participantDropdownOpen && (
                <div className="participant-dropdown-live" ref={participantDropdownRef}>
                  <div className="participant-search-wrap">
                    <Search size={14} />
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder="Rechercher des participants..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="participant-list-dropdown">
                    {allParticipants
                      .filter((p) => {
                        if (participants.some((sp) => sp.id === p.id)) return false;
                        if (!participantSearch.trim()) return true;
                        const q = participantSearch.toLowerCase();
                        const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                        return name.includes(q) || (p.email || '').toLowerCase().includes(q);
                      })
                      .map((p) => {
                        const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.email || '—');
                        return (
                          <div
                            key={p.id}
                            className="participant-option"
                            onClick={() => handleAddParticipant(p)}
                          >
                            <span className="participant-avatar-sm">
                              {(p.firstName || p.email || '?').charAt(0).toUpperCase()}
                            </span>
                            <span className="participant-info">
                              <span className="participant-name">{name}</span>
                              <span className="participant-email">{p.email}</span>
                            </span>
                          </div>
                        );
                      })}
                    {allParticipants.filter((p) => {
                      if (participants.some((sp) => sp.id === p.id)) return false;
                      if (!participantSearch.trim()) return true;
                      const q = participantSearch.toLowerCase();
                      const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                      return name.includes(q) || (p.email || '').toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="participant-empty">
                        {participantSearch.trim() ? 'Aucun participant correspondant' : 'Tous les participants ont été ajoutés'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="participants-list">
              {participants.length > 0 ? (
                participants.map((p) => (
                  <div key={p.id} className="participant-chip">
                    <span>{p.name}</span>
                    <button
                      type="button"
                      className="participant-chip-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveParticipant(p);
                      }}
                      title={`Retirer ${p.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state compact">
                  <Users size={20} className="empty-state-icon" />
                  <p>Aucun participant ajouté</p>
                </div>
              )}
            </div>
          </div>

          {dependencyMeeting && (
            <div className="prev-meeting-card" onClick={() => setPrevMeetingDrawerOpen(true)}>
              <div className="prev-meeting-card-icon">
                <BookOpen size={20} />
              </div>
              <div className="prev-meeting-card-content">
                <h4>Réunion précédente</h4>
                <p>{dependencyMeeting.objective || 'Consulter les détails et tâches de la réunion précédente'}</p>
              </div>
              <ChevronRight size={18} className="prev-meeting-card-arrow" />
            </div>
          )}

        </section>

        <section className="right-panel">
          <div className="tasks-module">
            <div className="module-header">
              <div>
                <h2>
                  <ListTodo size={18} />
                  Tâches
                </h2>
                <p>{pendingTasks} ouvertes, {completedTasks} terminées</p>
              </div>
            </div>

            <div className="quick-add-form">
              <input
                type="text"
                placeholder="Titre de la tâche..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="form-control"
              />
              <div className="live-form-row">
                <select
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  className="form-control"
                >
                  <option value="">Aucun(e) assigné(e)</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="form-control"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="form-control"
                >
                  <option value="LOW">Faible</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="task-btn"
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </div>

            <div className="task-list">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className={`task-item${task.status === 'COMPLETED' ? ' completed' : ''}`}>
                    <div className="task-item-left">
                      <input
                        type="checkbox"
                        checked={task.status === 'COMPLETED'}
                        onChange={() => handleToggleTask(task)}
                        className="task-checkbox"
                      />
                      <span className={`task-title${task.status === 'COMPLETED' ? ' completed' : ''}`}>
                        {task.title}
                      </span>
                      {task.priority && (
                        <span className={`task-priority priority-${task.priority.toLowerCase()}`}>
                          {task.priority === 'LOW' ? 'Faible' : task.priority === 'MEDIUM' ? 'Moyenne' : 'Haute'}
                        </span>
                      )}
                      {task.assignedToName && (
                        <span className="task-assignee">{task.assignedToName}</span>
                      )}
                      {task.dueDate && (
                        <span className="task-due">{task.dueDate}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="task-delete-btn"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Supprimer la tâche"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <CheckCircle2 size={24} className="empty-state-icon" />
                  <p>Aucune tâche pour le moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Discussion Module */}
          <div className="discussion-module">
            <div className="module-header">
              <div>
                <h2>
                  <MessageSquare size={18} />
                  Discussions
                </h2>
                <p>{discussionList.length} interventions enregistrées</p>
              </div>
            </div>

            <div className="discussion-form">
              <div className="live-form-row">
                <select
                  value={discParticipantId}
                  onChange={(e) => setDiscParticipantId(e.target.value)}
                  className="form-control"
                >
                  <option value="">— Sélectionner un intervenant —</option>
                  {participants.length === 0 && (
                    <option value="" disabled>Aucun participant dans cette réunion</option>
                  )}
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={discType}
                  onChange={(e) => setDiscType(e.target.value)}
                  className="form-control"
                >
                  <option value="">Type</option>
                  <option value="QUESTION">Question</option>
                  <option value="COMMENT">Commentaire</option>
                  <option value="DEBATE">Débat</option>
                  <option value="PROPOSITION">Proposition</option>
                  <option value="DECISION">Décision</option>
                  <option value="INFORMATION">Information</option>
                </select>
              </div>

              <div className="discussion-compose">
                <textarea
                  placeholder="Saisir ce qui a été dit..."
                  value={discContent}
                  onChange={(e) => setDiscContent(e.target.value)}
                  className="form-control"
                  rows="2"
                />
                <button
                  type="button"
                  onClick={handleAddDiscussion}
                  className="task-btn"
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </div>

            <ul className="discussion-list">
              {discussionList.map((d) => {
                const participant = participants.find((p) => p.id === d.participantId);
                const speakerName = participant?.name || d.participantName || d.speaker || 'Inconnu';
                return (
                  <li key={d.id} className="discussion-item">
                    <div className="discussion-avatar">
                      {speakerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="discussion-body">
                      <div className="discussion-header">
                        <span className="discussion-speaker">{speakerName}</span>
                        {d.type && (
                          <span className={`discussion-type-tag type-${d.type.toLowerCase()}`}>
                            {d.type === 'COMMENT' ? 'Commentaire' : d.type === 'DEBATE' ? 'Débat' : d.type === 'DECISION' ? 'Décision' : d.type === 'PROPOSITION' ? 'Proposition' : d.type === 'QUESTION' ? 'Question' : d.type === 'INFORMATION' ? 'Information' : d.type}
                          </span>
                        )}
                      </div>
                      <div className="discussion-content">{d.content}</div>
                    </div>
                  </li>
                );
              })}
              {discussionList.length === 0 && (
                <div className="empty-state">
                  <MessageSquare size={24} className="empty-state-icon" />
                  <p>Aucune discussion pour le moment</p>
                </div>
              )}
            </ul>
          </div>

        </section>

      </main>

      {/* Drawer Overlay for Previous Meeting */}
      {prevMeetingDrawerOpen && dependencyMeeting && (
        <div className="drawer-overlay" onClick={() => setPrevMeetingDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <BookOpen size={20} />
                <h2>Réunion précédente</h2>
              </div>
              <button className="drawer-close-btn" onClick={() => setPrevMeetingDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body">
              <div className="dependency-body">
                <div className="dependency-field">
                  <span className="dependency-label">Objectif</span>
                  <span className="dependency-value dependency-objective">
                    {dependencyMeeting.objective || '—'}
                  </span>
                </div>

                {dependencyMeeting.objet && (
                  <div className="dependency-field">
                    <span className="dependency-label">Objet</span>
                    <span className="dependency-value">{dependencyMeeting.objet}</span>
                  </div>
                )}

                {dependencyMeeting.description && (
                  <div className="dependency-field">
                    <span className="dependency-label">Description</span>
                    <span className="dependency-value">{dependencyMeeting.description}</span>
                  </div>
                )}

                <div className="dependency-row">
                  <div className="dependency-field">
                    <span className="dependency-label">Date</span>
                    <span className="dependency-value">
                      {dependencyMeeting.date || '—'}
                    </span>
                  </div>
                  <div className="dependency-field">
                    <span className="dependency-label">Type</span>
                    <span className="dependency-value">
                      {dependencyMeeting.type || '—'}
                    </span>
                  </div>
                </div>

                {dependencyMeeting.rapporteur && (
                  <div className="dependency-field">
                    <span className="dependency-label">Rapporteur</span>
                    <span className="dependency-value">{dependencyMeeting.rapporteur}</span>
                  </div>
                )}

                {dependencyMeeting.presidente && (
                  <div className="dependency-field">
                    <span className="dependency-label">Présidente</span>
                    <span className="dependency-value">{dependencyMeeting.presidente}</span>
                  </div>
                )}

                {dependencyMeeting.communes && (() => {
                  try {
                    const communes = typeof dependencyMeeting.communes === 'string'
                      ? JSON.parse(dependencyMeeting.communes)
                      : dependencyMeeting.communes;
                    if (Array.isArray(communes) && communes.length > 0) {
                      return (
                        <div className="dependency-field">
                          <span className="dependency-label">Communes</span>
                          <span className="dependency-value">
                            {communes.join(', ')}
                          </span>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {dependencyMeeting.recommendation && (() => {
                  try {
                    const recs = parseNotes(dependencyMeeting.recommendation, 'Recommendation');
                    if (recs.length > 0) {
                      return (
                        <div className="dependency-field">
                          <span className="dependency-label">Recommandations ({recs.length})</span>
                          <ul className="dependency-disc-list">
                            {recs.map((r, i) => (
                              <li key={i} className="dependency-disc-item">
                                <span className="dependency-disc-content">{r.content || r.title || r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {dependencyMeeting.tasks && (() => {
                  try {
                    const prevTasks = parseNotes(dependencyMeeting.tasks, 'Task');
                    if (prevTasks.length > 0) {
                      return (
                        <div className="dependency-field">
                          <span className="dependency-label">Tâches ({prevTasks.length})</span>
                          <ul className="dependency-task-list">
                            {prevTasks.map((t, idx) => (
                              <li key={idx} className={`dependency-task-item ${t.status === 'COMPLETED' ? 'completed' : ''}`}>
                                <label className="dependency-task-label">
                                  <input
                                    type="checkbox"
                                    checked={t.status === 'COMPLETED'}
                                    onChange={() => handleTogglePrevTask(idx)}
                                    disabled={!isAdmin}
                                    className="dependency-task-checkbox"
                                  />
                                  <span className="dependency-task-title">{t.title || t.content || t}</span>
                                </label>
                                {t.priority && (
                                  <span className={`task-priority priority-${t.priority.toLowerCase()} compact-tag`}>
                                    {t.priority}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {dependencyMeeting.discussion && (() => {
                  try {
                    const disc = typeof dependencyMeeting.discussion === 'string'
                      ? JSON.parse(dependencyMeeting.discussion)
                      : dependencyMeeting.discussion;
                    if (Array.isArray(disc) && disc.length > 0) {
                      return (
                        <div className="dependency-field">
                          <span className="dependency-label">Discussion ({disc.length} pts)</span>
                          <ul className="dependency-disc-list">
                            {disc.map((d, i) => (
                              <li key={i} className="dependency-disc-item">
                                <span className="dependency-disc-speaker">{d.speaker || '—'}</span>
                                {d.type && <span className="discussion-type-tag compact-tag">{d.type}</span>}
                                <span className="dependency-disc-content">{d.content}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
