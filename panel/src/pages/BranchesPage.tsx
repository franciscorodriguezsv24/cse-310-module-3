import { useState, type FormEvent } from 'react';

import { branchToForm, emptyBranchForm, validateBranchForm, type BranchForm } from '../lib/branchForm';
import { deleteBranch, saveBranch, useBranches } from '../lib/catalog';
import { slugify, type FormErrors } from '../lib/productForm';
import type { Branch } from '../types';

/** Branch list with an add/edit form and delete. */
export function BranchesPage() {
  const branches = useBranches();
  // null = form closed, 'new' = adding, otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const remove = async (branch: Branch) => {
    if (!window.confirm(`Delete the ${branch.name} branch? It will also be removed from every product.`)) return;
    setError('');
    try {
      const updated = await deleteBranch(branch.id);
      setMessage(`Deleted ${branch.name} and removed it from ${updated} product(s).`);
      if (editing === branch.id) setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const editingBranch = branches.data.find((b) => b.id === editing);

  return (
    <section className="stack">
      <div className="row">
        <h1>Branches</h1>
        <span className="spacer" />
        <button onClick={() => setEditing('new')} disabled={editing === 'new'}>
          + New branch
        </button>
      </div>

      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}
      {branches.error && <p className="error">Could not load branches: {branches.error.message}</p>}

      {editing && (
        <BranchEditor
          key={editing}
          branch={editingBranch}
          onDone={(text) => {
            setEditing(null);
            if (text) setMessage(text);
          }}
        />
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>WhatsApp</th>
              <th>Hours</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {branches.data.map((branch) => (
              <tr key={branch.id}>
                <td>{branch.name}</td>
                <td>{branch.address}</td>
                <td>{branch.whatsapp}</td>
                <td>{branch.hours}</td>
                <td className="actions">
                  <button className="link" onClick={() => setEditing(branch.id)}>
                    Edit
                  </button>
                  <button className="link danger" onClick={() => remove(branch)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Add form when `branch` is undefined, edit form otherwise. */
function BranchEditor({ branch, onDone }: { branch?: Branch; onDone: (message?: string) => void }) {
  const [form, setForm] = useState<BranchForm>(branch ? branchToForm(branch) : emptyBranchForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const field = (key: keyof BranchForm, label: string, props: { placeholder?: string; inputMode?: 'decimal' } = {}) => (
    <label>
      {label}
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        aria-invalid={!!errors[key]}
        {...props}
      />
      {errors[key] && <span className="error">{errors[key]}</span>}
    </label>
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateBranchForm(form);
    setErrors(result.errors);
    if (!result.fields) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveBranch(branch?.id ?? slugify(result.fields.name), result.fields, !branch);
      onDone(branch ? `Saved ${result.fields.name}.` : `Added ${result.fields.name}. Turn its products on from the Products page.`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      <h2>{branch ? `Edit ${branch.name}` : 'New branch'}</h2>
      <div className="grid">
        {field('name', 'Name', { placeholder: 'Orem' })}
        {field('whatsapp', 'WhatsApp number', { placeholder: '+1 555 555 0104' })}
        {field('address', 'Address')}
        {field('hours', 'Hours', { placeholder: '11:00 – 21:00' })}
        {field('latitude', 'Latitude', { placeholder: '40.2969', inputMode: 'decimal' })}
        {field('longitude', 'Longitude', { placeholder: '-111.6946', inputMode: 'decimal' })}
      </div>
      {saveError && <p className="error">{saveError}</p>}
      <div className="row">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : branch ? 'Save branch' : 'Add branch'}
        </button>
        <button type="button" className="ghost" onClick={() => onDone()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
