import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addInteraction, editInteraction, fetchInteractions } from '../store/interactionSlice';
import { fetchHCPs, fetchMaterials, fetchSamples } from '../store/hcpSlice';
import { setField, loadInteraction } from '../store/formSlice';
import type { FormState } from '../store/formSlice';
import type { RootState, AppDispatch } from '../store/store';

const INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Conference', 'Lunch'];
const SENTIMENTS = [
  { value: 'Positive', emoji: '😊' },
  { value: 'Neutral', emoji: '😐' },
  { value: 'Negative', emoji: '😞' },
];

export default function InteractionForm() {
  const dispatch = useDispatch<AppDispatch>();
  const { hcps, materials, samples } = useSelector((s: RootState) => s.hcps);
  const { loading } = useSelector((s: RootState) => s.interactions);

  // Read all form fields from the shared Redux form slice
  const form = useSelector((s: RootState) => s.form);

  const [hcpSearch, setHcpSearch] = useState('');
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [showHcpDropdown, setShowHcpDropdown] = useState(false);
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(fetchHCPs(''));
    dispatch(fetchMaterials(''));
    dispatch(fetchSamples());
  }, [dispatch]);

  // Clear local search state when switching interactions
  useEffect(() => {
    setHcpSearch('');
    setAttendeeSearch('');
    setMaterialSearch('');
  }, [form.editingId, form.savedId]);

  const handleChange = (field: keyof FormState, value: any) => {
    dispatch(setField({ field, value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.hcp_name) return;

    const payload = {
      hcp_name: form.hcp_name,
      interaction_type: form.interaction_type,
      date: `${form.date.split('-').reverse().join('-')}T${form.time}:00`,
      topics_discussed: form.topics_discussed,
      sentiment: form.sentiment,
      outcomes: form.outcomes,
      follow_up_actions: form.follow_up_actions,
      attendees: form.attendees,
      materials: form.selectedMaterials,
      samples: form.selectedSamples,
    };

    if (form.editingId) {
      await dispatch(editInteraction({ id: form.editingId, data: payload }));
      dispatch(fetchInteractions());
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } else {
      const resultAction = await dispatch(addInteraction(payload));
      if (addInteraction.fulfilled.match(resultAction)) {
        await dispatch(fetchInteractions());
        // Load the newly created interaction so form.editingId updates and Chat can reference it
        dispatch(loadInteraction(resultAction.payload));
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      }
    }
  };

  const filteredHcps = hcps.filter((h) =>
    h.name.toLowerCase().includes(hcpSearch.toLowerCase())
  );

  const filteredAttendees = hcps.filter((h) =>
    h.name.toLowerCase().includes(attendeeSearch.toLowerCase()) &&
    !form.attendees.includes(h.name)
  );

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    !form.selectedMaterials.includes(m.name)
  );

  return (
    <form className="interaction-form" onSubmit={handleSubmit}>
      {submitted && (
        <div className="success-banner">Interaction logged successfully!</div>
      )}

      {form.isDirty && form.savedId && (
        <div className="success-banner">
          Interaction #{form.savedId} saved to database. Form auto-filled below.
        </div>
      )}

      {form.isDirty && !form.savedId && (
        <div className="ai-filled-banner">
          AI has populated this form. Review the fields and click Save.
        </div>
      )}

      <h2 className="section-title">Interaction Details</h2>

      <div className="form-row">
        <div className="form-group">
          <label>HCP Name</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search or select HCP..."
              value={hcpSearch || form.hcp_name}
              onChange={(e) => {
                setHcpSearch(e.target.value);
                setShowHcpDropdown(true);
                if (!e.target.value) handleChange('hcp_name', '');
              }}
              onFocus={() => setShowHcpDropdown(true)}
              onBlur={() => setTimeout(() => setShowHcpDropdown(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
            {showHcpDropdown && filteredHcps.length > 0 && (
              <ul className="dropdown-list">
                {filteredHcps.map((h) => (
                  <li key={h.id} onMouseDown={() => {
                    handleChange('hcp_name', h.name);
                    setHcpSearch('');
                    setShowHcpDropdown(false);
                  }}>
                    {h.name} <span className="dropdown-sub">{h.specialty}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Interaction Type</label>
          <div className="select-wrapper">
            <select
              value={form.interaction_type}
              onChange={(e) => handleChange('interaction_type', e.target.value)}
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <div className="input-icon-wrapper">
            <input
              type="text"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
            <span className="input-icon">&#x1F4C5;</span>
          </div>
        </div>
        <div className="form-group">
          <label>Time</label>
          <div className="input-icon-wrapper">
            <input
              type="text"
              value={form.time}
              onChange={(e) => handleChange('time', e.target.value)}
            />
            <span className="input-icon">&#x1F550;</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Attendees</label>
        <div className="search-input-wrapper">
          <div className="tags-input">
            {form.attendees.map((a) => (
              <span key={a} className="tag">
                {a}
                <button type="button" onClick={() => handleChange('attendees', form.attendees.filter((x) => x !== a))}>x</button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Enter names or search..."
              value={attendeeSearch}
              onChange={(e) => {
                setAttendeeSearch(e.target.value);
                setShowAttendeeDropdown(true);
              }}
              onFocus={() => setShowAttendeeDropdown(true)}
              onBlur={() => setTimeout(() => setShowAttendeeDropdown(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </div>
          {showAttendeeDropdown && filteredAttendees.length > 0 && (
            <ul className="dropdown-list">
              {filteredAttendees.map((h) => (
                <li key={h.id} onMouseDown={() => {
                  handleChange('attendees', [...form.attendees, h.name]);
                  setAttendeeSearch('');
                  setShowAttendeeDropdown(false);
                }}>
                  {h.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Topics Discussed</label>
        <textarea
          placeholder="Enter key discussion points..."
          value={form.topics_discussed}
          onChange={(e) => handleChange('topics_discussed', e.target.value)}
          rows={4}
        />
      </div>

      <button type="button" className="voice-btn">
        &#x2728; Summarize from Voice Note (Requires Consent)
      </button>

      <h2 className="section-title">Materials Shared / Samples Distributed</h2>

      <div className="materials-section">
        <div className="materials-box">
          <div className="materials-header">
            <span className="materials-label">Materials Shared</span>
            <button type="button" className="search-add-btn" onClick={() => setShowMaterialModal(!showMaterialModal)}>
              &#x1F50D; Search/Add
            </button>
          </div>
          {form.selectedMaterials.length === 0 ? (
            <p className="no-items">No materials added.</p>
          ) : (
            <div className="tag-list">
              {form.selectedMaterials.map((m) => (
                <span key={m} className="tag">{m}
                  <button type="button" onClick={() => handleChange('selectedMaterials', form.selectedMaterials.filter((x) => x !== m))}>x</button>
                </span>
              ))}
            </div>
          )}
          {showMaterialModal && (
            <div className="mini-dropdown">
              <input
                type="text"
                placeholder="Search materials..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
              <ul>
                {filteredMaterials.map((m) => (
                  <li key={m.id} onClick={() => {
                    handleChange('selectedMaterials', [...form.selectedMaterials, m.name]);
                    setMaterialSearch('');
                    setShowMaterialModal(false);
                  }}>
                    {m.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="materials-box">
          <div className="materials-header">
            <span className="materials-label">Samples Distributed</span>
            <button type="button" className="search-add-btn" onClick={() => setShowSampleModal(!showSampleModal)}>
              &#x1F48A; Add Sample
            </button>
          </div>
          {form.selectedSamples.length === 0 ? (
            <p className="no-items">No samples added.</p>
          ) : (
            <div className="tag-list">
              {form.selectedSamples.map((s) => (
                <span key={s} className="tag">{s}
                  <button type="button" onClick={() => handleChange('selectedSamples', form.selectedSamples.filter((x) => x !== s))}>x</button>
                </span>
              ))}
            </div>
          )}
          {showSampleModal && (
            <div className="mini-dropdown">
              <ul>
                {samples.filter((s) => !form.selectedSamples.includes(s.name)).map((s) => (
                  <li key={s.id} onClick={() => {
                    handleChange('selectedSamples', [...form.selectedSamples, s.name]);
                    setShowSampleModal(false);
                  }}>
                    {s.name} ({s.product})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title">Observed/Inferred HCP Sentiment</h2>
      <div className="sentiment-row">
        {SENTIMENTS.map((s) => (
          <label key={s.value} className={`sentiment-option ${form.sentiment === s.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="sentiment"
              value={s.value}
              checked={form.sentiment === s.value}
              onChange={(e) => handleChange('sentiment', e.target.value)}
            />
            <span className="sentiment-emoji">{s.emoji}</span>
            <span>{s.value}</span>
          </label>
        ))}
      </div>

      <div className="form-group">
        <label>Outcomes</label>
        <textarea
          placeholder="Key outcomes or agreements..."
          value={form.outcomes}
          onChange={(e) => handleChange('outcomes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Follow-up Actions</label>
        <textarea
          placeholder="Enter next steps or tasks..."
          value={form.follow_up_actions}
          onChange={(e) => handleChange('follow_up_actions', e.target.value)}
          rows={3}
        />
      </div>

      <div className="ai-suggestions">
        <p className="ai-suggestions-title">AI Suggested Follow-ups:</p>
        {(form.suggestedFollowups.length > 0
          ? form.suggestedFollowups
          : ['Schedule follow-up meeting in 2 weeks', 'Send OncoBoost Phase III PDF', 'Add Dr. Sharma to advisory board invite list']
        ).map((s, i) => (
          <p key={i} className="ai-suggestion-item" onClick={() => {
            const current = form.follow_up_actions;
            handleChange('follow_up_actions', current ? `${current}\n${s}` : s);
          }}>
            + {s}
          </p>
        ))}
      </div>

      <button type="submit" className="submit-btn" disabled={loading || !form.hcp_name}>
        {loading ? 'Saving...' : form.editingId ? 'Update Interaction' : 'Save Interaction'}
      </button>
    </form>
  );
}
