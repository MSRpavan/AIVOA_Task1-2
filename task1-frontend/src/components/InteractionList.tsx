import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions, removeInteraction } from '../store/interactionSlice';
import { loadInteraction, resetForm } from '../store/formSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { InteractionResponse } from '../services/api';

const SENTIMENT_ICONS: Record<string, string> = {
  Positive: '\u{1F7E2}',
  Neutral: '\u{1F7E1}',
  Negative: '\u{1F534}',
};

export default function InteractionList() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((s: RootState) => s.interactions);
  const { editingId } = useSelector((s: RootState) => s.form);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  const handleSelect = (interaction: InteractionResponse) => {
    dispatch(loadInteraction(interaction));
  };

  const handleNew = () => {
    dispatch(resetForm());
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await dispatch(removeInteraction(id));
    if (editingId === id) {
      dispatch(resetForm());
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="interaction-list">
      <div className="list-header">
        <h2>Interactions</h2>
        <button className="new-btn" onClick={handleNew}>+ New</button>
      </div>

      {loading && <p className="list-loading">Loading...</p>}

      <div className="list-items">
        {items.length === 0 && !loading && (
          <p className="list-empty">No interactions yet. Use the form or chat to log one.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={`list-card ${editingId === item.id ? 'active' : ''}`}
            onClick={() => handleSelect(item)}
          >
            <div className="list-card-top">
              <span className="list-card-name">{item.hcp_name}</span>
              <span className="list-card-sentiment">
                {SENTIMENT_ICONS[item.sentiment] || ''} {item.sentiment}
              </span>
            </div>
            <div className="list-card-meta">
              <span className="list-card-type">{item.interaction_type}</span>
              <span className="list-card-date">{formatDate(item.date)}</span>
            </div>
            {item.topics_discussed && (
              <p className="list-card-topics">
                {item.topics_discussed.length > 80
                  ? item.topics_discussed.slice(0, 80) + '...'
                  : item.topics_discussed}
              </p>
            )}
            <button
              className="list-card-delete"
              onClick={(e) => handleDelete(e, item.id)}
              title="Delete interaction"
            >
              &#x2715;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
