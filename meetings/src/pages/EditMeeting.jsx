import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import './CreateMeeting.css';
import communesData from '../data/communes.json';

const MEETING_TYPES = [
  'préinstruction', 'information', "information et d'orientation",
  'sensibilisation', 'concertation', 'coordination', 'suivi',
  'suivi et coordination', 'planification', 'validation',
];

const ROOM_OPTIONS = [
  'Salle de réunion "Cabinet"',
  'Salle de réunion "Secrétariat Général"',
  'Salle de réunion "Secrétaire Général"',
  'Salle de réunion "Hall"',
  'Salle de conférences',
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function EditMeeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dependencesOpen, setDependencesOpen] = useState(false);
  const [historiqueOptions, setHistoriqueOptions] = useState([]);
  const [dependencesSearch, setDependencesSearch] = useState('');
  const dependencesRef = useRef(null);

  const [communesOpen, setCommunesOpen] = useState(false);
  const [communesSearch, setCommunesSearch] = useState('');
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const communesRef = useRef(null);

  const [internalServicesOptions, setInternalServicesOptions] = useState([]);
  const [internalServicesOpen, setInternalServicesOpen] = useState(false);
  const [internalServicesSearch, setInternalServicesSearch] = useState('');
  const [selectedInternalServices, setSelectedInternalServices] = useState([]);
  const internalServicesRef = useRef(null);

  const [externalServicesOptions, setExternalServicesOptions] = useState([]);
  const [externalServicesOpen, setExternalServicesOpen] = useState(false);
  const [externalServicesSearch, setExternalServicesSearch] = useState('');
  const [selectedExternalServices, setSelectedExternalServices] = useState([]);
  const externalServicesRef = useRef(null);
  const [form, setForm] = useState({
    objective: '',
    type: 'préinstruction',
    status: 'planned',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    room: '',
    objet: '',
    dependences: '',
    rapporteur: '',
    presidente: '',
  });

  useEffect(() => {
    let ignore = false;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/meetings/${id}`);
        if (ignore) return;
        setForm({
          objective: data.objective || data.title || '',
          type: data.type || 'préinstruction',
          status: data.status || 'planned',
          description: data.description || '',
          date: data.date || '',
          startTime: data.startTime || data.time || '',
          endTime: data.endTime || '',
          room: data.room || data.location || '',
          objet: data.objet || '',
          dependences: data.dependences || '',
          rapporteur: data.rapporteur || '',
          presidente: data.presidente || '',
          communes: data.communes || [],
        });
        setSelectedCommunes(data.communes || []);
        if (data.audiences) {
          setSelectedInternalServices(data.audiences.filter(a => a.description === 'service interne'));
          setSelectedExternalServices(data.audiences.filter(a => a.description === 'service externe'));
        }
      } catch {
        if (!ignore) {
          showToast('Failed to load meeting', 'error');
          navigate('/meetings');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetch();
    return () => { ignore = true; };
  }, [id, navigate, showToast]);

  /* fetch historique objectives ────────────────────────────────── */
  useEffect(() => {
    api.get('/api/historique/objectives')
      .then(({ data }) => setHistoriqueOptions(Array.isArray(data) ? data : []))
      .catch(() => setHistoriqueOptions([]));
  }, []);

  /* fetch audiences ──────────────────────────────────────────── */
  useEffect(() => {
    api.get('/api/audiences')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setInternalServicesOptions(list.filter(a => a.description === 'service interne'));
        setExternalServicesOptions(list.filter(a => a.description === 'service externe'));
      })
      .catch(() => {
        setInternalServicesOptions([]);
        setExternalServicesOptions([]);
      });
  }, []);

  /* outside click closes dependences dropdown ──────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (dependencesRef.current && !dependencesRef.current.contains(e.target)) {
        setDependencesOpen(false);
      }
    };
    if (dependencesOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dependencesOpen]);

  /* outside click closes communes dropdown ─────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (communesRef.current && !communesRef.current.contains(e.target)) {
        setCommunesOpen(false);
        setCommunesSearch('');
      }
    };
    if (communesOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [communesOpen]);

  /* outside click closes internal services dropdown ──────────── */
  useEffect(() => {
    const handler = (e) => {
      if (internalServicesRef.current && !internalServicesRef.current.contains(e.target)) {
        setInternalServicesOpen(false);
        setInternalServicesSearch('');
      }
    };
    if (internalServicesOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [internalServicesOpen]);

  /* outside click closes external services dropdown ──────────── */
  useEffect(() => {
    const handler = (e) => {
      if (externalServicesRef.current && !externalServicesRef.current.contains(e.target)) {
        setExternalServicesOpen(false);
        setExternalServicesSearch('');
      }
    };
    if (externalServicesOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [externalServicesOpen]);

  const toggleCommune = (commune) => {
    setSelectedCommunes((prev) =>
      prev.includes(commune) ? prev.filter((c) => c !== commune) : [...prev, commune]
    );
  };

  const filteredCommunes = communesData.filter((c) =>
    c.toLowerCase().includes(communesSearch.toLowerCase())
  );

  const toggleInternalService = (service) => {
    setSelectedInternalServices((prev) => {
      const exists = prev.find(s => s.id === service.id);
      return exists ? prev.filter((s) => s.id !== service.id) : [...prev, service];
    });
  };

  const filteredInternalServices = internalServicesOptions.filter((a) =>
    a.name.toLowerCase().includes(internalServicesSearch.toLowerCase())
  );

  const toggleExternalService = (service) => {
    setSelectedExternalServices((prev) => {
      const exists = prev.find(s => s.id === service.id);
      return exists ? prev.filter((s) => s.id !== service.id) : [...prev, service];
    });
  };

  const filteredExternalServices = externalServicesOptions.filter((a) =>
    a.name.toLowerCase().includes(externalServicesSearch.toLowerCase())
  );

  const filteredOptions = historiqueOptions.filter((obj) =>
    obj.toLowerCase().includes(dependencesSearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.objective.trim()) {
      showToast('Objective is required', 'warning');
      return;
    }
    if (form.endTime && form.startTime && form.endTime <= form.startTime) {
      showToast('End time must be after start time', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, communes: selectedCommunes, audienceIds: [...selectedInternalServices, ...selectedExternalServices].map(a => a.id) };
      await api.put(`/api/meetings/${id}`, payload);
      showToast('Meeting updated!', 'success');
      navigate(`/meetings/${id}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update meeting', 'error');
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Edit Meeting</h1>
        <p className="text-muted">Update the meeting details</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <div className="form-group">
          <label htmlFor="objective">Objective <span className="required">*</span></label>
          <input id="objective" name="objective" value={form.objective} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" value={form.type} onChange={handleChange}>
              {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} rows="3" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="room">Room</label>
            <select id="room" name="room" value={form.room} onChange={handleChange}>
              <option value="">— Select a room —</option>
              {ROOM_OPTIONS.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="objet">Objet</label>
            <input
              id="objet"
              name="objet"
              value={form.objet}
              onChange={handleChange}
              placeholder="e.g. Suivi de projet"
            />
          </div>
          <div className="form-group">
            <label>Dépendances</label>
            <div className="participant-select" ref={dependencesRef}>
              <div
                className={`participant-trigger${dependencesOpen ? ' open' : ''}`}
                onClick={() => {
                  setDependencesOpen((prev) => !prev);
                  setDependencesSearch('');
                }}
              >
                {form.dependences ? (
                  <div className="participant-chips">
                    <span className="participant-chip">
                      {form.dependences}
                      <button
                        type="button"
                        className="participant-chip-x"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((prev) => ({ ...prev, dependences: '' }));
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ) : (
                  <span className="participant-placeholder">
                    Select a deleted meeting objective...
                  </span>
                )}
                <span style={{ color: 'var(--color-text-muted)' }}>▾</span>
              </div>

              {dependencesOpen && (
                <div className="participant-dropdown">
                  <div className="participant-search-wrap">
                    <span>🔍</span>
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder="Type to filter..."
                      value={dependencesSearch}
                      onChange={(e) => setDependencesSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="participant-list">
                    {filteredOptions.map((obj) => (
                      <div
                        key={obj}
                        className={`participant-option${form.dependences === obj ? ' selected' : ''}`}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, dependences: obj }));
                          setDependencesOpen(false);
                          setDependencesSearch('');
                        }}
                      >
                        <span className="participant-name">{obj}</span>
                        {form.dependences === obj && <span>✓</span>}
                      </div>
                    ))}
                    {filteredOptions.length === 0 && (
                      <div className="participant-empty">
                        {dependencesSearch.trim()
                          ? 'No matching objectives'
                          : historiqueOptions.length === 0
                            ? 'No deleted meetings available'
                            : 'No matching objectives'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rapporteur">Rapporteur</label>
            <input
              id="rapporteur"
              name="rapporteur"
              value={form.rapporteur}
              onChange={handleChange}
              placeholder="e.g. Jean Dupont"
            />
          </div>
          <div className="form-group">
            <label htmlFor="presidente">Présidente / Président</label>
            <select
              id="presidente"
              name="presidente"
              value={form.presidente}
              onChange={handleChange}
            >
              <option value="">Select a President...</option>
              <option value="Le gouverneur">Le gouverneur</option>
              <option value="Le secrétaire général">Le secrétaire général</option>
              <option value="Le chef de la division des affaires intérieures">Le chef de la division des affaires intérieures</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <input id="startTime" name="startTime" type="time" value={form.startTime} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">End Time</label>
            <input id="endTime" name="endTime" type="time" value={form.endTime} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Communes</label>
          <div className="participant-select" ref={communesRef}>
            <div
              className={`participant-trigger${communesOpen ? ' open' : ''}`}
              onClick={() => {
                setCommunesOpen((prev) => !prev);
                setCommunesSearch('');
              }}
            >
              {selectedCommunes.length > 0 ? (
                <div className="participant-chips">
                  {selectedCommunes.map((c) => (
                    <span key={c} className="participant-chip">
                      {c}
                      <button
                        type="button"
                        className="participant-chip-x"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCommune(c);
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="participant-placeholder">Select communes...</span>
              )}
              <span style={{ color: 'var(--color-text-muted)' }}>▾</span>
            </div>

            {communesOpen && (
              <div className="participant-dropdown">
                <div className="participant-search-wrap">
                  <span>🔍</span>
                  <input
                    className="participant-search-input"
                    type="text"
                    placeholder="Type a commune..."
                    value={communesSearch}
                    onChange={(e) => setCommunesSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="participant-list">
                  {filteredCommunes.map((c) => {
                    const isSelected = selectedCommunes.includes(c);
                    return (
                      <label
                        key={c}
                        className={`participant-option${isSelected ? ' selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCommune(c)}
                          className="participant-checkbox"
                        />
                        <span className="participant-name">{c}</span>
                        {isSelected && <span>✓</span>}
                      </label>
                    );
                  })}
                  {filteredCommunes.length === 0 && (
                    <div className="participant-empty">No matching communes</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Services Internes</label>
          <div className="participant-select" ref={internalServicesRef}>
            <div
              className={`participant-trigger${internalServicesOpen ? ' open' : ''}`}
              onClick={() => {
                setInternalServicesOpen((prev) => !prev);
                setInternalServicesSearch('');
              }}
            >
              {selectedInternalServices.length > 0 ? (
                <div className="participant-chips">
                  {selectedInternalServices.map((a) => (
                    <span key={a.id} className="participant-chip">
                      {a.name}
                      <button
                        type="button"
                        className="participant-chip-x"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInternalService(a);
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="participant-placeholder">Select services internes...</span>
              )}
              <span style={{ color: 'var(--color-text-muted)' }}>▾</span>
            </div>

            {internalServicesOpen && (
              <div className="participant-dropdown">
                <div className="participant-search-wrap">
                  <span>🔍</span>
                  <input
                    className="participant-search-input"
                    type="text"
                    placeholder="Type a service interne..."
                    value={internalServicesSearch}
                    onChange={(e) => setInternalServicesSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="participant-list">
                  {filteredInternalServices.map((a) => {
                    const isSelected = selectedInternalServices.some(s => s.id === a.id);
                    return (
                      <label
                        key={a.id}
                        className={`participant-option${isSelected ? ' selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInternalService(a)}
                          className="participant-checkbox"
                        />
                        <span className="participant-name">{a.name}</span>
                        {isSelected && <span>✓</span>}
                      </label>
                    );
                  })}
                  {filteredInternalServices.length === 0 && (
                    <div className="participant-empty">No matching services</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Services Externes</label>
          <div className="participant-select" ref={externalServicesRef}>
            <div
              className={`participant-trigger${externalServicesOpen ? ' open' : ''}`}
              onClick={() => {
                setExternalServicesOpen((prev) => !prev);
                setExternalServicesSearch('');
              }}
            >
              {selectedExternalServices.length > 0 ? (
                <div className="participant-chips">
                  {selectedExternalServices.map((a) => (
                    <span key={a.id} className="participant-chip">
                      {a.name}
                      <button
                        type="button"
                        className="participant-chip-x"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExternalService(a);
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="participant-placeholder">Select services externes...</span>
              )}
              <span style={{ color: 'var(--color-text-muted)' }}>▾</span>
            </div>

            {externalServicesOpen && (
              <div className="participant-dropdown">
                <div className="participant-search-wrap">
                  <span>🔍</span>
                  <input
                    className="participant-search-input"
                    type="text"
                    placeholder="Type a service externe..."
                    value={externalServicesSearch}
                    onChange={(e) => setExternalServicesSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="participant-list">
                  {filteredExternalServices.map((a) => {
                    const isSelected = selectedExternalServices.some(s => s.id === a.id);
                    return (
                      <label
                        key={a.id}
                        className={`participant-option${isSelected ? ' selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExternalService(a)}
                          className="participant-checkbox"
                        />
                        <span className="participant-name">{a.name}</span>
                        {isSelected && <span>✓</span>}
                      </label>
                    );
                  })}
                  {filteredExternalServices.length === 0 && (
                    <div className="participant-empty">No matching services</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/meetings/${id}`)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}