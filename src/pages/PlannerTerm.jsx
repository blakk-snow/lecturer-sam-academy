import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Plus, Trash2, BookOpen } from 'lucide-react';
import { useTerm, useClassGroups, useSubjectsForTerm, usePlannerActions } from '../hooks/usePlanner';
import { subjects as curriculumSubjects, classes as curriculumClasses, curriculumMap } from '../data/curriculumData';
import { Button } from '../components/ui/Button';

const CLASS_LEVELS = [
  { id: 'B1', label: 'Basic 1' },
  { id: 'B2', label: 'Basic 2' },
  { id: 'B3', label: 'Basic 3' },
  { id: 'B4', label: 'Basic 4' },
  { id: 'B5', label: 'Basic 5' },
  { id: 'B6', label: 'Basic 6' },
  { id: 'B7', label: 'Basic 7' },
  { id: 'B8', label: 'Basic 8' },
  { id: 'B9', label: 'Basic 9' },
];

export default function PlannerTerm() {
  const { termId } = useParams();
  const navigate = useNavigate();

  const term        = useTerm(termId);
  const classGroups = useClassGroups(termId);
  const allSubjects = useSubjectsForTerm(termId, classGroups);
  const actions     = usePlannerActions();

  // Add class group state
  const [showAddClass, setShowAddClass] = useState(false);
  const [classLevelInput, setClassLevelInput] = useState('B7');

  // Add subject state
  const [addSubjectForGroup, setAddSubjectForGroup] = useState(null);
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [subjectCurriculumSubjectId, setSubjectCurriculumSubjectId] = useState('');
  const [subjectCurriculumClassId, setSubjectCurriculumClassId] = useState('');

  async function handleAddClass() {
    await actions.addClassGroup(termId, classLevelInput);
    setShowAddClass(false);
    setClassLevelInput('B7');
  }

  async function handleRemoveClass(cg) {
    if (window.confirm(`Remove ${getClassLabel(cg.classLevel)}? All subjects and week plans inside will be deleted.`)) {
      await actions.removeClassGroup(cg.id, termId);
    }
  }

  async function handleAddSubject() {
    if (!subjectNameInput.trim()) return;
    await actions.addSubject(
      addSubjectForGroup,
      subjectNameInput.trim(),
      subjectCurriculumSubjectId || null,
      subjectCurriculumClassId || null,
      termId
    );
    closeAddSubjectModal();
  }

  function closeAddSubjectModal() {
    setAddSubjectForGroup(null);
    setSubjectNameInput('');
    setSubjectCurriculumSubjectId('');
    setSubjectCurriculumClassId('');
  }

  async function handleRemoveSubject(subject) {
    if (window.confirm(`Remove "${subject.name}"? All week plans will be deleted.`)) {
      await actions.removeSubject(subject.id, termId, subject.classGroupId);
    }
  }

  function getClassLabel(classLevelId) {
    return CLASS_LEVELS.find(c => c.id === classLevelId)?.label ?? classLevelId;
  }

  function getSubjectsForGroup(groupId) {
    return (allSubjects ?? []).filter(s => s.classGroupId === groupId);
  }

  // When curriculum subject changes, reset class selection
  function handleCurriculumSubjectChange(subjId) {
    setSubjectCurriculumSubjectId(subjId);
    setSubjectCurriculumClassId('');
  }

  // Classes available for the selected curriculum subject
  const availableCurriculumClasses = subjectCurriculumSubjectId
    ? curriculumClasses.filter(c => Boolean((curriculumMap[subjectCurriculumSubjectId] ?? {})[c.id]))
    : [];

  const inputClass = 'border border-line rounded-xl bg-paper px-3 py-2 w-full text-ink focus:outline-none focus:border-accent text-sm';

  if (term === undefined) {
    return <div className="pb-24 px-4 pt-6 text-ink-soft">Loading…</div>;
  }

  if (term === null) {
    return (
      <div className="pb-24 px-4 pt-6">
        <p className="text-ink-soft">Term not found.</p>
        <button onClick={() => navigate('/planner')} className="mt-3 text-accent text-sm">
          ← Back to Planner
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => navigate('/planner')}
          className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-3"
        >
          <ArrowLeft size={16} />
          Back to Planner
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink">{term.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="rounded-full bg-accent/10 text-accent text-xs px-2 py-0.5 font-medium">
                {term.year}
              </span>
              <span className="text-sm text-ink-soft">Term {term.termNumber}</span>
            </div>
          </div>
          <Button variant="primary" className="text-sm px-4 py-2 min-h-0 shrink-0" onClick={() => setShowAddClass(true)}>
            <Plus size={16} />
            Add Class
          </Button>
        </div>
      </div>

      {/* Class groups */}
      <div className="px-4 space-y-4">
        {classGroups?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <BookOpen size={40} className="text-ink-soft/30" />
            <div>
              <p className="text-ink font-semibold">No classes yet</p>
              <p className="text-sm text-ink-soft mt-1">Add a class group to start assigning subjects.</p>
            </div>
            <Button variant="secondary" onClick={() => setShowAddClass(true)}>
              <Plus size={16} />
              Add Class
            </Button>
          </div>
        )}

        {classGroups?.map(cg => {
          const subjects = getSubjectsForGroup(cg.id);
          return (
            <div key={cg.id} className="border border-line rounded-xl bg-card overflow-hidden">
              {/* Class header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-paper">
                <span className="font-semibold text-ink">{getClassLabel(cg.classLevel)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAddSubjectForGroup(cg.id)}
                    className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 px-2 py-1 rounded-lg"
                  >
                    <Plus size={14} />
                    Add Subject
                  </button>
                  <button
                    onClick={() => handleRemoveClass(cg)}
                    className="p-1.5 text-ink-soft hover:text-red-500 rounded-lg"
                    aria-label="Remove class"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Subjects */}
              {subjects.length === 0 ? (
                <p className="text-sm text-ink-soft px-4 py-4 text-center">No subjects yet. Add one above.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {subjects.map(subject => (
                    <li key={subject.id} className="flex items-center px-4 py-3 gap-3">
                      <button
                        className="flex-1 text-left"
                        onClick={() => navigate(`/planner/${termId}/${subject.id}`)}
                      >
                        <span className="font-medium text-ink">{subject.name}</span>
                        {subject.curriculumSubjectId && subject.curriculumClassId && (
                          <span className="ml-2 text-xs text-ink-soft">
                            ({curriculumSubjects.find(s => s.id === subject.curriculumSubjectId)?.label ?? subject.curriculumSubjectId}
                            {' · '}
                            {curriculumClasses.find(c => c.id === subject.curriculumClassId)?.label ?? subject.curriculumClassId})
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRemoveSubject(subject)}
                          className="p-1.5 text-ink-soft hover:text-red-500 rounded-lg"
                          aria-label="Remove subject"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/planner/${termId}/${subject.id}`)}
                          className="p-1.5 text-ink-soft hover:text-ink rounded-lg"
                          aria-label="Open subject planner"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Add class modal */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-xl p-5 max-w-sm w-full mx-4">
            <h2 className="font-semibold text-ink mb-4">Add Class Group</h2>
            <label className="text-sm text-ink-soft font-medium">Class Level</label>
            <select
              value={classLevelInput}
              onChange={e => setClassLevelInput(e.target.value)}
              className={`${inputClass} mt-1 mb-4`}
            >
              {CLASS_LEVELS.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1" onClick={handleAddClass}>
                Add Class
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => { setShowAddClass(false); setClassLevelInput('B7'); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add subject modal */}
      {addSubjectForGroup !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-xl p-5 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-semibold text-ink mb-4">Add Subject</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-ink-soft font-medium">Subject Name</label>
                <input
                  type="text"
                  value={subjectNameInput}
                  onChange={e => setSubjectNameInput(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className={`${inputClass} mt-1`}
                />
              </div>

              <div>
                <label className="text-sm text-ink-soft font-medium">
                  Link to Curriculum Subject <span className="text-ink-soft/60">(optional)</span>
                </label>
                <select
                  value={subjectCurriculumSubjectId}
                  onChange={e => handleCurriculumSubjectChange(e.target.value)}
                  className={`${inputClass} mt-1`}
                >
                  <option value="">— None —</option>
                  {curriculumSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {subjectCurriculumSubjectId && (
                <div>
                  <label className="text-sm text-ink-soft font-medium">Curriculum Class</label>
                  <select
                    value={subjectCurriculumClassId}
                    onChange={e => setSubjectCurriculumClassId(e.target.value)}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="">— Select class —</option>
                    {availableCurriculumClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAddSubject}
                disabled={!subjectNameInput.trim()}
              >
                Add Subject
              </Button>
              <Button variant="secondary" className="flex-1" onClick={closeAddSubjectModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
