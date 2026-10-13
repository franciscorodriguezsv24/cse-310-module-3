import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { OptionGroupsEditor } from '../components/OptionGroupsEditor';
import { createProduct, deleteProduct, getProduct, updateProduct, useBranches, useCategories } from '../lib/catalog';
import {
  emptyProductForm,
  productToForm,
  slugify,
  validateProductForm,
  type FormErrors,
  type ProductForm,
} from '../lib/productForm';

/** Create (/products/new) or edit (/products/:id) a product. */
export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const categories = useCategories();
  const branches = useBranches();

  const [loadedForm, setForm] = useState<ProductForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Edit: load the product once. New: start from a blank form once categories/branches are loaded.
  useEffect(() => {
    if (!isNew) {
      getProduct(id)
        .then((product) => (product ? setForm(productToForm(product)) : setNotFound(true)))
        .catch((e: Error) => setSaveError(`Could not load the product: ${e.message}`));
    }
  }, [id, isNew]);

  const blankReady = isNew && !categories.loading && !branches.loading;
  const form =
    loadedForm ??
    (blankReady ? emptyProductForm(categories.data[0]?.id ?? '', branches.data.map((b) => b.id)) : null);

  if (notFound) {
    return (
      <section className="stack">
        <h1>Product not found</h1>
        <p className="muted">It may have been deleted by someone else.</p>
        <Link to="/products">Back to products</Link>
      </section>
    );
  }
  if (!form) return <p className="muted">{saveError || 'Loading…'}</p>;

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm({ ...form, [key]: value });
    // Drop the stale message for this field; the rest are re-checked on the next save.
    if (errors[key]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const toggleBranch = (branchId: string, available: boolean) =>
    set('availableAt', available ? [...form.availableAt, branchId] : form.availableAt.filter((b) => b !== branchId));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateProductForm(form);
    setErrors(result.errors);
    setSaveError('');
    if (!result.fields) return;
    setSaving(true);
    try {
      if (isNew) await createProduct(slugify(result.fields.name), result.fields);
      else await updateProduct(id, result.fields);
      navigate('/products');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (isNew || !window.confirm(`Delete "${form.name}"? This can't be undone.`)) return;
    try {
      await deleteProduct(id);
      navigate('/products');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="row">
        <h1>{isNew ? 'New product' : `Edit ${form.name || 'product'}`}</h1>
        <span className="spacer" />
        <Link to="/products">Cancel</Link>
      </div>

      <fieldset className="card grid">
        <legend>Details</legend>
        <label>
          Name
          <input value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <span className="error">{errors.name}</span>}
          {isNew && form.name && <span className="muted small">Document id: products/{slugify(form.name)}</span>}
        </label>
        <label>
          Emoji
          <input value={form.emoji} onChange={(e) => set('emoji', e.target.value)} className="short" />
        </label>
        <label>
          Category
          <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            {categories.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="error">{errors.categoryId}</span>}
        </label>
        <label>
          Base price ($)
          <input
            inputMode="decimal"
            value={form.basePrice}
            onChange={(e) => set('basePrice', e.target.value)}
            aria-invalid={!!errors.basePrice}
            className="short"
          />
          {errors.basePrice && <span className="error">{errors.basePrice}</span>}
        </label>
        <label className="wide">
          Description
          <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="card">
        <legend>Sold at</legend>
        <div className="row wrap">
          {branches.data.map((branch) => (
            <label key={branch.id} className="check">
              <input
                type="checkbox"
                checked={form.availableAt.includes(branch.id)}
                onChange={(e) => toggleBranch(branch.id, e.target.checked)}
              />
              {branch.name}
            </label>
          ))}
        </div>
      </fieldset>

      <OptionGroupsEditor
        groups={form.optionGroups}
        branches={branches.data}
        errors={errors}
        onChange={(optionGroups) => set('optionGroups', optionGroups)}
      />

      {hasErrors && <p className="error">Fix the highlighted fields before saving.</p>}
      {saveError && <p className="error">{saveError}</p>}

      <div className="row">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
        <span className="spacer" />
        {!isNew && (
          <button type="button" className="danger" onClick={remove}>
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
