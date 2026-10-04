import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarDays, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { db } from '../db/database';
import { createTerm, updateTerm, deleteTerm } from '../db/planner';
import { TermForm } from '../components/planner/TermForm';
import { Button } from '../components/ui/Button';

export default function Planner() {
  const navigate = useNavigate();
  const terms = useLiveQuery(() => db.terms.orderBy('createdAt').reverse().toArray(), []);

  const [showCreate, setShowCreate] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  async function handleCreate(formData) {
    await createTerm(formData);
    setShowCreate(false);
  }

  async function handleEdit(formData) {
    await updateTerm(editingTerm.id, formData);
    setEditingTerm(null);
  }

  async function handleDelete(term) {
    if (window.confirm(`Delete "${term.name}"? This will also remove all classes, subjects and week plans inside it.`)) {
      await deleteTerm(term.id);
    }
  }

  function formatDateRange(start, end) {
    if (!start && !end) return null;
    const fmt = d => d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '?';
    return `${fmt(start)} – ${fmt(end)}`;
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={22} className="text-accent" />
            <h1 className="text-xl font-bold text-ink">Lesson Planner</h1>
          </div>
          <Button variant="primary" className="text-sm px-4 py-2 min-h-0" onClick={() => setShowCreate(true)}>
            + Create Term
          </Button>
        </div>
        <p className="text-sm text-ink-soft mt-1">Plan your teaching terms, classes and weekly topics.</p>
      </div>

      {/* Terms list */}
      <div className="px-4">
        {terms === undefined && (
          <p className="text-center text-ink-soft py-12">Loading…</p>
        )}

        {terms?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <CalendarDays size={48} className="text-ink-soft/30" />
            <div>
              <p className="text-ink font-semibold">No terms yet</p>
              <p className="text-sm text-ink-soft mt-1">Create your first term to start planning.</p>
            </div>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              + Create Term
            </Button>
          </div>
        )}

        {terms?.map(term => {
          const dateRange = formatDateRange(term.startDate, term.endDate);
          return (
            <div
              key={term.id}
              className="border border-line rounded-xl bg-card p-4 mb-3 flex items-start gap-3"
            >
              {/* Main content — tappable to navigate */}
              <button
                className="flex-1 text-left min-w-0"
                onClick={() => navigate(`/planner/${term.id}`)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink">{term.name}</span>
                  <span className="rounded-full bg-accent/10 text-accent text-xs px-2 py-0.5 font-medium">
                    {term.year}
                  </span>
                  <span className="text-xs text-ink-soft">Term {term.termNumber}</span>
                </div>
                {dateRange && (
                  <p className="text-sm text-ink-soft mt-0.5">{dateRange}</p>
                )}
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingTerm(term)}
                  className="p-2 text-ink-soft hover:text-ink rounded-lg"
                  aria-label="Edit term"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(term)}
                  className="p-2 text-ink-soft hover:text-red-500 rounded-lg"
                  aria-label="Delete term"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => navigate(`/planner/${term.id}`)}
                  className="p-2 text-ink-soft hover:text-ink rounded-lg"
                  aria-label="Open term"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-xl p-5 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-semibold text-ink mb-4">New Term</h2>
            <TermForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-xl p-5 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-semibold text-ink mb-4">Edit Term</h2>
            <TermForm
              initialValues={editingTerm}
              onSubmit={handleEdit}
              onCancel={() => setEditingTerm(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
