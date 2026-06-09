import './CreateMeeting.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import communesData from '../data/communes.json';

/* ── inline icons ──────────────────────────────────────────────── */
const Icon = ({ name, size = 18 }) => {
  const paths = {
    calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z',
    clock: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z',
    users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'map-pin': 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    'file-text': 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-4h8v2H8v-2z',
    bookmark: 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z',
    user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    x: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z',
    'chevron-down': 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    'alert-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    type: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z',
    'image': 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[name] || ''} />
    </svg>
  );
};

/* ── constants ──────────────────────────────────────────────────── */
const ROOM_OPTIONS = [
  'Salle de réunion "Cabinet"',
  'Salle de réunion "Secrétariat Général"',
  'Salle de réunion "Secrétaire Général"',
  'Salle de réunion "Hall"',
  'Salle de conférences',
];

const MEETING_TYPES = [
  'préinstruction',
  'information',
  "information et d'orientation",
  'sensibilisation',
  'concertation',
  'coordination',
  'suivi',
  'suivi et coordination',
  'planification',
  'validation',
];

const EMPTY_FORM = {
  objective: '',
  type: 'préinstruction',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  objet: '',
  dependences: '',
  rapporteur: '',
  presidente: '',
};

/* ── component ──────────────────────────────────────────────────── */
export default function CreateMeeting() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isPhotographer } = useAuth();
  const { t } = useTranslation();

  // Display-label mappers for values stored in French
  const meetingTypeLabel = (value) => {
    const keys = {
      'préinstruction': 'createMeeting.meeting_types.preinstruction',
      'information': 'createMeeting.meeting_types.information',
      "information et d'orientation": 'createMeeting.meeting_types.information_et_dorientation',
      'sensibilisation': 'createMeeting.meeting_types.sensibilisation',
      'concertation': 'createMeeting.meeting_types.concertation',
      'coordination': 'createMeeting.meeting_types.coordination',
      'suivi': 'createMeeting.meeting_types.suivi',
      'suivi et coordination': 'createMeeting.meeting_types.suivi_et_coordination',
      'planification': 'createMeeting.meeting_types.planification',
      'validation': 'createMeeting.meeting_types.validation',
    };
    return t(keys[value], value);
  };
  const roomLabel = (value) => {
    const keys = {
      'Salle de réunion "Cabinet"': 'createMeeting.rooms.cabinet',
      'Salle de réunion "Secrétariat Général"': 'createMeeting.rooms.secretariat_general',
      'Salle de réunion "Secrétaire Général"': 'createMeeting.rooms.secretaire_general',
      'Salle de réunion "Hall"': 'createMeeting.rooms.hall',
      'Salle de conférences': 'createMeeting.rooms.conferences',
    };
    return t(keys[value], value);
  };
  const presidentLabel = (value) => {
    const keys = {
      'Le gouverneur': 'createMeeting.president_options.gouverneur',
      'Le secrétaire général': 'createMeeting.president_options.secretaire_general',
      'Le chef de la division des affaires intérieures': 'createMeeting.president_options.chef_division',
    };
    return t(keys[value], value);
  };

  useEffect(() => {
    if (isPhotographer) {
      navigate('/meetings', { replace: true });
    }
  }, [isPhotographer, navigate]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const todayStr = (() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  /* fetch participants ──────────────────────────────────────────── */
  useEffect(() => {
    api.get('/api/participants')
      .then(({ data }) => {
        setParticipants(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  /* fetch historique objectives ────────────────────────────────── */
  useEffect(() => {
    api.get('/api/historique/objectives')
      .then(({ data }) => setHistoriqueOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /* fetch audiences ──────────────────────────────────────────── */
  useEffect(() => {
    api.get('/api/audiences')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setInternalServicesOptions(data.filter(a => a.description === 'service interne'));
          setExternalServicesOptions(data.filter(a => a.description === 'service externe'));
        }
      })
      .catch(() => {});
  }, []);

  /* check room availability ──────────────────────────────── */
  useEffect(() => {
    const checkAvailability = async () => {
      const { room, date, startTime, endTime } = form;
      if (!room || !date || !startTime || !endTime) {
        setConflicts([]);
        return;
      }

      setCheckingAvailability(true);
      try {
        const { data } = await api.get('/api/meetings/check-availability', {
          params: { room, date, startTime, endTime }
        });
        setConflicts(data);
      } catch (err) {
        console.error('Failed to check room availability', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timer = setTimeout(checkAvailability, 400);
    return () => clearTimeout(timer);
  }, [form.room, form.date, form.startTime, form.endTime]);

  /* click-outside handlers ─────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dependencesRef.current && !dependencesRef.current.contains(e.target))
        setDependencesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (communesRef.current && !communesRef.current.contains(e.target))
        setCommunesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (internalServicesRef.current && !internalServicesRef.current.contains(e.target))
        setInternalServicesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (externalServicesRef.current && !externalServicesRef.current.contains(e.target))
        setExternalServicesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── handlers ──────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleParticipant = (p) => {
    setSelectedParticipants((prev) => {
      const exists = prev.find((sp) => sp.id === p.id);
      return exists ? prev.filter((sp) => sp.id !== p.id) : [...prev, p];
    });
  };

  const removeParticipant = (id) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const filteredParticipants = participants.filter((p) => {
    const search = participantSearch.toLowerCase();
    const name = (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.email || '').toLowerCase();
    return name.includes(search) || (p.email || '').toLowerCase().includes(search);
  });

  const toggleCommune = (c) => {
    setSelectedCommunes((prev) => {
      const exists = prev.includes(c);
      return exists ? prev.filter((x) => x !== c) : [...prev, c];
    });
  };

  const removeCommune = (c) => {
    setSelectedCommunes((prev) => prev.filter((x) => x !== c));
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

  const removeInternalService = (serviceId) => {
    setSelectedInternalServices((prev) => prev.filter((s) => s.id !== serviceId));
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

  const removeExternalService = (serviceId) => {
    setSelectedExternalServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const filteredExternalServices = externalServicesOptions.filter((a) =>
    a.name.toLowerCase().includes(externalServicesSearch.toLowerCase())
  );

  const handleFilesSelect = (files) => {
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  };

  const removeFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleImagesSelect = (files) => {
    const newFiles = Array.from(files);
    setSelectedImages((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  };

  const removeImage = (name) => {
    setSelectedImages((prev) => prev.filter((f) => f.name !== name));
  };

  /* ── validation ───────────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!form.objective.trim()) errs.objective = t('createMeeting.validation.objective_required');
    if (!form.type.trim()) errs.type = t('createMeeting.validation.type_required');
    if (!form.date) {
      errs.date = t('createMeeting.validation.date_required');
    } else if (form.date < todayStr) {
      errs.date = t('createMeeting.validation.date_before_today', "La date ne peut pas être antérieure à aujourd'hui");
    }
    if (conflicts.length > 0) {
      errs.room = "Cette salle est déjà occupée pour l'horaire sélectionné.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── submit ────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast(t('createMeeting.validation.fix_errors'), 'warning');
      return;
    }
    if (conflicts.length > 0) {
      showToast("La salle sélectionnée est occupée.", 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        audiences: [
          ...selectedInternalServices,
          ...selectedExternalServices,
        ],
        participants: selectedParticipants.map((p) => p.id),
        communes: selectedCommunes,
      };

      const { data: meeting } = await api.post('/api/meetings', payload);

      // Upload files if any
      if (selectedFiles.length > 0 || selectedImages.length > 0) {
        setUploadingFiles(true);
        const uploadPromises = [];

        selectedFiles.forEach((file) => {
          const fd = new FormData();
          fd.append('file', file);
          uploadPromises.push(
            api.post(`/api/meetings/${meeting.id}/documents`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          );
        });

        selectedImages.forEach((image) => {
          const fd = new FormData();
          fd.append('file', image);
          uploadPromises.push(
            api.post(`/api/meetings/${meeting.id}/photos`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          );
        });

        await Promise.all(uploadPromises);
        setUploadingFiles(false);
      }

      showToast(t('createMeeting.success'), 'success');
      navigate('/meetings');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to create meeting';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{t('createMeeting.title')}</h1>
          <p className="text-muted">{t('createMeeting.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-form" noValidate>
        {/* ── Section: Meeting Info ───────────────────────────── */}
        <fieldset className="form-section">
          <legend className="form-section-title">
            <Icon name="bookmark" size={16} />
            {t('createMeeting.sections.meeting_info')}
          </legend>

          <div className="field-group">
            <label htmlFor="objective" className="field-label">
              {t('createMeeting.fields.objective.label')} <span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="objective"
              name="objective"
              type="text"
              className={`field-input${errors.objective ? ' field-error' : ''}`}
              value={form.objective}
              onChange={handleChange}
              placeholder={t('createMeeting.fields.objective.placeholder')}
              autoFocus
            />
            {errors.objective && <span className="field-error-msg">{errors.objective}</span>}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="type" className="field-label">
                {t('createMeeting.fields.type.label')} <span className="field-required" aria-hidden="true">*</span>
              </label>
              <div className="field-select-wrap">
                <select
                  id="type"
                  name="type"
                  className={`field-select${errors.type ? ' field-error' : ''}`}
                  value={form.type}
                  onChange={handleChange}
                >
                  {MEETING_TYPES.map((type) => (
                    <option key={type} value={type}>{meetingTypeLabel(type)}</option>
                  ))}
                </select>
                <Icon name="chevron-down" size={14} />
              </div>
              {errors.type && <span className="field-error-msg">{errors.type}</span>}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="description" className="field-label">
              {t('createMeeting.fields.description.label')}
            </label>
            <textarea
              id="description"
              name="description"
              className="field-textarea"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder={t('createMeeting.fields.description.placeholder')}
              maxLength={1000}
            />
            <span className="field-hint">
              {form.description.length}/1000 {t('createMeeting.description_counter')}
            </span>
          </div>
        </fieldset>

        {/* ── Section: Schedule ──────────────────────────────── */}
        <fieldset className="form-section">
          <legend className="form-section-title">
            <Icon name="calendar" size={16} />
            {t('createMeeting.sections.schedule')}
          </legend>

          <div className="field-group">
            <label htmlFor="date" className="field-label">
              {t('createMeeting.fields.date.label')} <span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className={`field-input${errors.date ? ' field-error' : ''}`}
              value={form.date}
              onChange={handleChange}
              min={todayStr}
            />
            {errors.date && <span className="field-error-msg">{errors.date}</span>}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="startTime" className="field-label">
                {t('createMeeting.fields.start_time.label')}
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                className="field-input"
                value={form.startTime}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label htmlFor="endTime" className="field-label">
                {t('createMeeting.fields.end_time.label')}
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                className="field-input"
                value={form.endTime}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        {/* ── Section: Location & Context ─────────────────────── */}
        <fieldset className="form-section">
          <legend className="form-section-title">
            <Icon name="map-pin" size={16} />
            {t('createMeeting.sections.location_context')}
          </legend>

          <div className="field-group">
            <label htmlFor="room" className="field-label">
              {t('createMeeting.fields.room.label')}
            </label>
            <div className="field-select-wrap">
              <select
                id="room"
                name="room"
                className={`field-select${errors.room ? ' field-error' : ''}`}
                value={form.room}
                onChange={handleChange}
              >
                <option value="">{t('createMeeting.select_placeholder')}</option>
                {ROOM_OPTIONS.map((room) => (
                  <option key={room} value={room}>{roomLabel(room)}</option>
                ))}
              </select>
              <Icon name="chevron-down" size={14} />
            </div>
            {errors.room && <span className="field-error-msg">{errors.room}</span>}

            {conflicts.length > 0 && (
              <div className="availability-conflict-banner">
                <Icon name="alert-circle" size={16} />
                <div className="conflict-text">
                  <strong>Attention :</strong> Cette salle est occupée sur ce créneau :
                  <ul>
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        {c.objective || c.title || 'Réunion'} ({c.startTime?.substring(0, 5) || '--:--'} - {c.endTime?.substring(0, 5) || '--:--'})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ── Objet ─────────────────────────────────────────── */}
          <div className="field-group">
            <label htmlFor="objet" className="field-label">
              {t('createMeeting.fields.objet.label')}
            </label>
            <input
              id="objet"
              name="objet"
              type="text"
              className="field-input"
              value={form.objet}
              onChange={handleChange}
              placeholder={t('createMeeting.fields.objet.placeholder')}
            />
          </div>

          {/* ── Dependences ───────────────────────────────────── */}
          <div className="field-group">
            <label className="field-label">
              {t('createMeeting.fields.dependences.label')}
            </label>
            <div className="participant-select" ref={dependencesRef}>
              <div
                className={`participant-trigger${dependencesOpen ? ' open' : ''}`}
                onClick={() => { setDependencesOpen((v) => !v); setDependencesSearch(''); }}
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
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  </div>
                ) : (
                  <span className="participant-placeholder">
                    {t('createMeeting.fields.dependences.placeholder')}
                  </span>
                )}
                <Icon name="chevron-down" size={14} />
              </div>

              {dependencesOpen && (
                <div className="participant-dropdown">
                  <div className="participant-search-wrap">
                    <Icon name="search" size={14} />
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder={t('createMeeting.dependences.filter_placeholder')}
                      value={dependencesSearch}
                      onChange={(e) => setDependencesSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="participant-list">
                    {historiqueOptions
                      .filter((obj) => obj.toLowerCase().includes(dependencesSearch.toLowerCase()))
                      .map((obj) => (
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
                          {form.dependences === obj && <Icon name="check" size={14} />}
                        </div>
                      ))}
                    {historiqueOptions.filter((obj) =>
                      obj.toLowerCase().includes(dependencesSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="participant-empty">
                        {dependencesSearch.trim()
                          ? t('createMeeting.dependences.no_matching')
                          : t('createMeeting.dependences.no_available')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Communes multi-select ────────────────────────── */}
          <div className="field-group">
            <label className="field-label">
              <Icon name="users" size={14} /> {t('createMeeting.fields.communes.label')}
            </label>
            <div className="participant-select" ref={communesRef}>
              <div
                className={`participant-trigger${communesOpen ? ' open' : ''}`}
                onClick={() => { setCommunesOpen((v) => !v); setCommunesSearch(''); }}
              >
                {selectedCommunes.length > 0 ? (
                  <div className="participant-chips">
                    {selectedCommunes.slice(0, 3).map((c) => (
                      <span key={c} className="participant-chip">
                        {c}
                        <button
                          type="button"
                          className="participant-chip-x"
                          onClick={(e) => { e.stopPropagation(); removeCommune(c); }}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                    {selectedCommunes.length > 3 && (
                      <span className="participant-chip overflow">+{selectedCommunes.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="participant-placeholder">
                    {t('createMeeting.fields.communes.placeholder')}
                  </span>
                )}
                <Icon name="chevron-down" size={14} />
              </div>

              {communesOpen && (
                <div className="participant-dropdown">
                  <div className="participant-search-wrap">
                    <Icon name="search" size={14} />
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder={t('createMeeting.fields.communes.placeholder')}
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
                          <span className="participant-info" style={{ marginLeft: 8 }}>
                            <span className="participant-name">{c}</span>
                          </span>
                          {isSelected && <Icon name="check" size={14} />}
                        </label>
                      );
                    })}
                    {filteredCommunes.length === 0 && (
                      <div className="participant-empty">
                        {communesSearch.trim()
                          ? t('createMeeting.communes_section.no_matching')
                          : t('createMeeting.communes_section.no_available')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedCommunes.length > 0 && (
              <span className="field-hint">
                {selectedCommunes.length}{' '}
                {selectedCommunes.length > 1
                  ? t('createMeeting.communes_section.selected_other')
                  : t('createMeeting.communes_section.selected_one')}
              </span>
            )}
          </div>

          {/* ── Services Internes multi-select ───────────────── */}
          <div className="field-group">
            <label className="field-label">
              <Icon name="users" size={14} /> {t('createMeeting.fields.services_internes.label')}
            </label>
            <div className="participant-select" ref={internalServicesRef}>
              <div
                className={`participant-trigger${internalServicesOpen ? ' open' : ''}`}
                onClick={() => { setInternalServicesOpen((v) => !v); setInternalServicesSearch(''); }}
              >
                {selectedInternalServices.length > 0 ? (
                  <div className="participant-chips">
                    {selectedInternalServices.map((s) => (
                      <span key={s.id} className="participant-chip">
                        {s.name}
                        <button
                          type="button"
                          className="participant-chip-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInternalService(s.id);
                          }}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="participant-placeholder">
                    {t('createMeeting.services.search_placeholder')}
                  </span>
                )}
                <Icon name="chevron-down" size={14} />
              </div>

              {internalServicesOpen && (
                <div className="participant-dropdown">
                  <div className="participant-search-wrap">
                    <Icon name="search" size={14} />
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder={t('createMeeting.services.search_placeholder')}
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
                          {isSelected && <Icon name="check" size={14} />}
                        </label>
                      );
                    })}
                    {filteredInternalServices.length === 0 && (
                      <div className="participant-empty">
                        {t('createMeeting.services.no_internes')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedInternalServices.length > 0 && (
              <span className="field-hint">
                {selectedInternalServices.length}{' '}
                {selectedInternalServices.length > 1
                  ? t('createMeeting.services.interne_other')
                  : t('createMeeting.services.interne_one')}
              </span>
            )}
          </div>

          {/* ── Services Externes multi-select ───────────────── */}
          <div className="field-group">
            <label className="field-label">
              <Icon name="users" size={14} /> {t('createMeeting.fields.services_externes.label')}
            </label>
            <div className="participant-select" ref={externalServicesRef}>
              <div
                className={`participant-trigger${externalServicesOpen ? ' open' : ''}`}
                onClick={() => { setExternalServicesOpen((v) => !v); setExternalServicesSearch(''); }}
              >
                {selectedExternalServices.length > 0 ? (
                  <div className="participant-chips">
                    {selectedExternalServices.map((s) => (
                      <span key={s.id} className="participant-chip">
                        {s.name}
                        <button
                          type="button"
                          className="participant-chip-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExternalService(s.id);
                          }}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="participant-placeholder">
                    {t('createMeeting.services.search_placeholder')}
                  </span>
                )}
                <Icon name="chevron-down" size={14} />
              </div>

              {externalServicesOpen && (
                <div className="participant-dropdown">
                  <div className="participant-search-wrap">
                    <Icon name="search" size={14} />
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder={t('createMeeting.services.search_placeholder')}
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
                          {isSelected && <Icon name="check" size={14} />}
                        </label>
                      );
                    })}
                    {filteredExternalServices.length === 0 && (
                      <div className="participant-empty">
                        {t('createMeeting.services.no_externes')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedExternalServices.length > 0 && (
              <span className="field-hint">
                {selectedExternalServices.length}{' '}
                {selectedExternalServices.length > 1
                  ? t('createMeeting.services.externe_other')
                  : t('createMeeting.services.externe_one')}
              </span>
            )}
          </div>
        </fieldset>

        {/* ── Section: Documents ─────────────────────────────── */}
        <fieldset className="form-section">
          <legend className="form-section-title">
            <Icon name="file-text" size={16} />
            {t('createMeeting.sections.documents')}
          </legend>

          <div className="field-group">
            <label className="field-label">
              {t('createMeeting.documents.add')}
            </label>
            <div
              className="dropzone-area"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelect(e.dataTransfer.files);
              }}
            >
              <Icon name="file-text" size={24} />
              <p>{t('createMeeting.documents.dropzone')}</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFilesSelect(e.target.files)}
              />
            </div>
            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((f) => (
                  <div key={f.name} className="file-item">
                    <span className="file-name">{f.name}</span>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => removeFile(f.name)}
                      title={t('createMeeting.documents.remove')}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedFiles.length === 0 && (
              <span className="field-hint">{t('createMeeting.documents.none')}</span>
            )}
          </div>
        </fieldset>

        {/* ── Section: Photos ────────────────────────────────── */}
        <fieldset className="form-section">
          <legend className="form-section-title">
            <Icon name="image" size={16} />
            {t('createMeeting.sections.photos')}
          </legend>

          <div className="field-group">
            <label className="field-label">
              {t('createMeeting.photos.add')}
            </label>
            <div
              className="dropzone-area"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                handleImagesSelect(e.dataTransfer.files);
              }}
            >
              <Icon name="image" size={24} />
              <p>{t('createMeeting.photos.dropzone')}</p>
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleImagesSelect(e.target.files)}
              />
            </div>
            {selectedImages.length > 0 && (
              <div className="file-list">
                {selectedImages.map((f) => (
                  <div key={f.name} className="file-item">
                    <span className="file-name">{f.name}</span>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => removeImage(f.name)}
                      title={t('createMeeting.photos.remove')}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedImages.length === 0 && (
              <span className="field-hint">{t('createMeeting.photos.none')}</span>
            )}
          </div>
        </fieldset>

        {/* ── Section: People ────────────────────────────────── */}
        <fieldset className="form-section">
          <legend className="form-section-title">
            <Icon name="user" size={16} />
            {t('createMeeting.sections.people')}
          </legend>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="rapporteur" className="field-label">{t('createMeeting.fields.rapporteur.label')}</label>
              <input
                id="rapporteur"
                name="rapporteur"
                type="text"
                className="field-input"
                value={form.rapporteur}
                onChange={handleChange}
                placeholder={t('createMeeting.fields.rapporteur.placeholder')}
              />
            </div>
            <div className="field-group">
              <label htmlFor="presidente" className="field-label">{t('createMeeting.fields.presidente.label')}</label>
              <div className="field-select-wrap">
                <select
                  id="presidente"
                  name="presidente"
                  className="field-select"
                  value={form.presidente}
                  onChange={handleChange}
                >
                  <option value="">{t('createMeeting.select_placeholder')}</option>
                  <option value="Le gouverneur">{presidentLabel('Le gouverneur')}</option>
                  <option value="Le secrétaire général">{presidentLabel('Le secrétaire général')}</option>
                  <option value="Le chef de la division des affaires intérieures">
                    {presidentLabel('Le chef de la division des affaires intérieures')}
                  </option>
                </select>
                <Icon name="chevron-down" size={14} />
              </div>
            </div>
          </div>

          {/* ── Participant multi-select ─────────────────────── */}
          <div className="field-group">
            <label className="field-label">
              <Icon name="users" size={14} /> {t('createMeeting.fields.participants.label')}
            </label>
            <div className="participant-select" ref={dropdownRef}>
              <div
                className={`participant-trigger${dropdownOpen ? ' open' : ''}`}
                onClick={() => setDropdownOpen((v) => !v)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDropdownOpen((v) => !v);
                  }
                }}
              >
                {selectedParticipants.length > 0 ? (
                  <div className="participant-chips">
                    {selectedParticipants.slice(0, 3).map((p) => {
                      const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.email || '—';
                      return (
                        <span key={p.id} className="participant-chip">
                          {name}
                          <button
                            type="button"
                            className="participant-chip-x"
                            onClick={(e) => { e.stopPropagation(); removeParticipant(p.id); }}
                            aria-label={`Remove ${name}`}
                          >
                            <Icon name="x" size={12} />
                          </button>
                        </span>
                      );
                    })}
                    {selectedParticipants.length > 3 && (
                      <span className="participant-chip overflow">+{selectedParticipants.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="participant-placeholder">
                    <Icon name="search" size={14} /> {t('createMeeting.participants.search_placeholder')}
                  </span>
                )}
                <Icon name="chevron-down" size={14} />
              </div>

              {dropdownOpen && (
                <div className="participant-dropdown">
                  <div className="participant-search-wrap">
                    <Icon name="search" size={14} />
                    <input
                      className="participant-search-input"
                      type="text"
                      placeholder={t('createMeeting.participants.search_input')}
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="participant-list">
                    {filteredParticipants.map((p) => {
                      const isSelected = selectedParticipants.some(
                        (sp) => sp.id === p.id
                      );
                      const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : '—';
                      return (
                        <label
                          key={p.id}
                          className={`participant-option${isSelected ? ' selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleParticipant(p)}
                            className="participant-checkbox"
                          />
                          <span className="participant-avatar">
                            {(p.firstName || p.email || '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="participant-info">
                            <span className="participant-name">{name}</span>
                            <span className="participant-email">{p.email}</span>
                          </span>
                          {isSelected && <Icon name="check" size={14} />}
                        </label>
                      );
                    })}
                    {filteredParticipants.length === 0 && (
                      <div className="participant-empty">
                        {participantSearch.trim()
                          ? t('createMeeting.participants.no_matching')
                          : t('createMeeting.participants.no_available')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedParticipants.length > 0 && (
              <span className="field-hint">
                {selectedParticipants.length}{' '}
                {selectedParticipants.length > 1
                  ? t('createMeeting.participants.selected_other')
                  : t('createMeeting.participants.selected_one')}
              </span>
            )}
          </div>
        </fieldset>

        {/* ── Actions ────────────────────────────────────────── */}
        <div className="form-actions-bar">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/meetings')}
          >
            {t('createMeeting.actions.cancel')}
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading && uploadingFiles ? (
              <span className="btn-loading">
                <span className="spinner-sm" aria-hidden="true" />
                {t('createMeeting.actions.uploading')}
              </span>
            ) : loading ? (
              <span className="btn-loading">
                <span className="spinner-sm" aria-hidden="true" />
                {t('createMeeting.actions.creating')}
              </span>
            ) : (
              <>
                <Icon name="type" size={16} />
                {t('createMeeting.actions.create')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
