/**
 * Timetable.jsx — teacher timetable editor
 *
 * Grid of school days × periods per class. Edits are saved via
 * useTeacherSchedule().save — Firestore when signed in, local Dexie
 * always — and the AI assistant can generate the initial timetable.
 */

import { useEffect, useRef, useState } from 'react';
import { CalendarRange, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useTeacherSchedule } from '../hooks/useTeacherSchedule';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { DAY_ORDER } from '../data/ai/teacherSchedule';
import { Button } from '../components/ui/Button';

const SCHOOL_DAYS = DAY_ORDER.slice(0, 5);
const MIN_PERIODS = 4;

function emptyDay() {
  return Object.fromEntries(SCHOOL_DAYS.map(d => [d, []]));
}

export default function Timetable() {
  const { schedule, source, loading, save } = useTeacherSchedule();
  const { user } = useAuth();
  const { openPanel } = useChat();

  const [timetable, setTimetable] = useState(null); // { [cls]: { [day]: [{subject, period}] } }
  const [periodsPerClass, setPeriodsPerClass] = useState({});
  const [activeClass, setActiveClass] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [addingClass, setAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const loadedKeyRef = useRef(null);

  // Initialise the editable copy once per loaded schedule version, so a
  // live Firestore snapshot doesn't clobber unsaved edits.
  useEffect(() => {
    if (!schedule?.weeklyTimetable) return;
    const key = `${schedule.scheduleId ?? 'sample'}-${schedule.scheduleVersion ?? 0}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;

    const clone = {};
    const periods = {};
    for (const [cls, days] of Object.entries(schedule.weeklyTimetable)) {
      clone[cls] = {};
      let maxPeriod = MIN_PERIODS;
      for (const day of SCHOOL_DAYS) {
        clone[cls][day] = (days?.[day] ?? []).map(e => ({ ...e }));
        for (const entry of clone[cls][day]) {
          maxPeriod = Math.max(maxPeriod, entry.period ?? 0);
        }
      }
      periods[cls] = maxPeriod;
    }
    setTimetable(clone);
    setPeriodsPerClass(periods);
    setActiveClass(prev => prev ?? Object.keys(clone)[0] ?? null);
    setDirty(false);
  }, [schedule]);

  if (loading && timetable === null) {
    return <div className="pb-24 px-4 pt-6 text-ink-soft">Loading timetable…</div>;
  }

  const classes = timetable ? Object.keys(timetable) : [];
  const current = activeClass ?? classes[0] ?? null;
  const periodCount = current ? (periodsPerClass[current] ?? MIN_PERIODS) : 0;

  // ── Mutators ─────────────────────────────────────────────────────────────────
  function mutate(fn) {
    setTimetable(prev => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  }

  function setCell(cls, day, period, subject) {
    mutate(next => {
      const entries = next[cls]?.[day] ?? [];
      const trimmed = subject.trim();
      const existing = entries.find(e => e.period === period);
      if (!trimmed) {
        if (existing) next[cls][day] = entries.filter(e => e.period !== period);
        return;
      }
      if (existing) existing.subject = trimmed;
      else entries.push({ subject: trimmed, period });
    });
  }

  function changePeriodCount(cls, delta) {
    const target = (periodsPerClass[cls] ?? MIN_PERIODS) + delta;
    if (target < MIN_PERIODS) return;
    if (delta < 0) {
      setTimetable(prev => {
        const next = structuredClone(prev);
        for (const day of SCHOOL_DAYS) {
          next[cls][day] = (next[cls][day] ?? []).filter(e => (e.period ?? 0) < target);
        }
        return next;
      });
    }
    setPeriodsPerClass(prev => ({ ...prev, [cls]: target }));
    setDirty(true);
  }

  function addClass() {
    const name = newClassName.trim();
    if (!name) return;
    mutate(next => { next[name] = emptyDay(); });
    setPeriodsPerClass(prev => ({ ...prev, [name]: MIN_PERIODS }));
    setActiveClass(name);
    setNewClassName('');
    setAddingClass(false);
  }

  function removeClass(cls) {
    if (!window.confirm(`Remove ${cls} from the timetable?`)) return;
    setTimetable(prev => {
      const next = { ...prev };
      delete next[cls];
      return next;
    });
    setPeriodsPerClass(prev => {
      const next = { ...prev };
      delete next[cls];
      return next;
    });
    setActiveClass(prev => (prev === cls ? (Object.keys(timetable).find(c => c !== cls) ?? null) : prev));
    setDirty(true);
  }

  async function handleSave() {
    if (!timetable || saving) return;
    setSaving(true);
    try {
      await save(timetable);
      setDirty(false);
      setSavedAt(Date.now());
    } catch (err) {
      window.alert(`Could not save the timetable: ${err?.message ?? 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  const cellClass = 'w-full min-w-[7.5rem] border border-line rounded-lg bg-paper px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent placeholder:text-ink-soft/40';

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <CalendarRange size={20} className="text-accent" />
            Timetable
          </h1>
          <p className="text-sm text-ink-soft mt-0.5">
            Your weekly teaching schedule
            {source === 'cloud' && ' · synced to your account'}
            {source === 'offline' && ' · saved on this device (offline)'}
            {source === 'local' && ' · saved on this device'}
            {source === 'sample' && ' · sample data'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!user && dirty && (
            <span className="text-xs text-amber-700">Saves on this device only — sign in on Profile to sync.</span>
          )}
          <Button variant="primary" className="text-sm px-4 py-2 min-h-0" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved ✓'}
          </Button>
        </div>
      </div>

      {savedAt && !dirty && (
        <p className="px-4 -mt-2 text-xs text-green-700" role="status">
          Saved {new Date(savedAt).toLocaleTimeString()}.
        </p>
      )}

      {/* Class chips */}
      <div className="px-4 flex items-center gap-2 flex-wrap mb-4">
        {classes.map(cls => (
          <span key={cls} className="inline-flex items-center gap-1">
            <button
              onClick={() => setActiveClass(cls)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition ${
                activeClass === cls || (!activeClass && cls === classes[0])
                  ? 'bg-accent text-white border-accent'
                  : 'border-line bg-card text-ink hover:border-accent'
              }`}
            >
              {cls}
            </button>
            <button
              onClick={() => removeClass(cls)}
              className="p-1 rounded-full text-ink-soft hover:text-red-500"
              aria-label={`Remove ${cls}`}
            >
              <Trash2 size={13} />
            </button>
          </span>
        ))}

        {addingClass ? (
          <span className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addClass(); if (e.key === 'Escape') setAddingClass(false); }}
              placeholder="e.g. Basic 9"
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-accent"
              aria-label="New class name"
            />
            <button onClick={addClass} className="p-1 rounded-full text-accent" aria-label="Confirm add class">
              <Plus size={14} />
            </button>
          </span>
        ) : (
          <button
            onClick={() => setAddingClass(true)}
            className="rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-ink-soft hover:text-accent hover:border-accent"
          >
            + Add class
          </button>
        )}
      </div>

      {/* Empty state */}
      {classes.length === 0 && (
        <div className="mx-4 flex flex-col items-center justify-center py-16 text-center gap-4 rounded-2xl border border-dashed border-line">
          <CalendarRange size={40} className="text-ink-soft/30" />
          <div>
            <p className="text-ink font-semibold">No timetable yet</p>
            <p className="text-sm text-ink-soft mt-1">
              Add a class above, or let the AI assistant generate one for you.
            </p>
          </div>
          <Button variant="secondary" onClick={openPanel}>Create with AI assistant</Button>
        </div>
      )}

      {/* Grid */}
      {current && (
        <div className="px-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16 text-left text-xs uppercase tracking-wide text-ink-soft font-semibold py-2 pr-2">
                  Period
                </th>
                {SCHOOL_DAYS.map(day => (
                  <th key={day} className="text-left text-xs uppercase tracking-wide text-ink-soft font-semibold py-2 px-1">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: periodCount }, (_, i) => i + 1).map(period => (
                <tr key={period}>
                  <td className="pr-2 py-1 text-sm font-semibold text-ink-soft">{period}</td>
                  {SCHOOL_DAYS.map(day => {
                    const entry = (timetable[current]?.[day] ?? []).find(e => e.period === period);
                    return (
                      <td key={day} className="p-1">
                        <input
                          value={entry?.subject ?? ''}
                          onChange={e => setCell(current, day, period, e.target.value)}
                          placeholder="—"
                          className={cellClass}
                          aria-label={`${day} period ${period}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => changePeriodCount(current, 1)}
              className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium"
            >
              <Plus size={15} /> Add period
            </button>
            {periodCount > MIN_PERIODS && (
              <button
                onClick={() => changePeriodCount(current, -1)}
                className="text-sm text-ink-soft hover:text-red-500"
              >
                Remove last period
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
