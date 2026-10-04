import { useState } from 'react';
import { Button } from '../../components/ui/Button';

export function TermForm({ initialValues = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialValues.name ?? '',
    year: initialValues.year ?? '',
    termNumber: initialValues.termNumber ?? 1,
    startDate: initialValues.startDate ?? '',
    endDate: initialValues.endDate ?? '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'termNumber' ? Number(value) : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  const labelClass = 'text-sm text-ink-soft font-medium';
  const inputClass = 'border border-line rounded-xl bg-paper px-3 py-2 w-full text-ink focus:outline-none focus:border-accent';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Term Name</label>
        <input
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. First Term"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Academic Year</label>
        <input
          name="year"
          type="text"
          value={form.year}
          onChange={handleChange}
          required
          placeholder="2026/2027"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Term Number</label>
        <select
          name="termNumber"
          value={form.termNumber}
          onChange={handleChange}
          className={inputClass}
        >
          <option value={1}>Term 1</option>
          <option value={2}>Term 2</option>
          <option value={3}>Term 3</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Start Date</label>
        <input
          name="startDate"
          type="date"
          value={form.startDate}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>End Date</label>
        <input
          name="endDate"
          type="date"
          value={form.endDate}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" className="flex-1">
          Save
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
