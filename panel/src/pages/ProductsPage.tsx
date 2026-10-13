import { useState } from 'react';
import { Link } from 'react-router';

import { deleteProduct, setProductAvailability, useBranches, useCategories, useProducts } from '../lib/catalog';
import { formatMoney } from '../lib/money';
import type { Branch, Product } from '../types';

/** Product list filtered by category and branch, with per-branch availability toggles and delete. */
export function ProductsPage() {
  const [categoryId, setCategoryId] = useState('');
  const [branchId, setBranchId] = useState('');
  const categories = useCategories();
  const branches = useBranches();
  const products = useProducts({ categoryId: categoryId || undefined, branchId: branchId || undefined });
  const [actionError, setActionError] = useState('');

  const categoryName = (id: string) => categories.data.find((c) => c.id === id)?.name ?? id;

  /** Runs a write and shows its error instead of failing silently. */
  const run = async (action: () => Promise<unknown>) => {
    setActionError('');
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmDelete = (product: Product) => {
    if (window.confirm(`Delete "${product.name}"? Customers will stop seeing it right away. This can't be undone.`)) {
      run(() => deleteProduct(product.id));
    }
  };

  return (
    <section className="stack">
      <div className="row">
        <h1>Products</h1>
        <span className="spacer" />
        <Link className="button" to="/products/new">
          + New product
        </Link>
      </div>

      <div className="row filters">
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sold at
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Any branch</option>
            {branches.data.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {actionError && <p className="error">{actionError}</p>}
      {products.error && <p className="error">Could not load products: {products.error.message}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="num">Price</th>
              {branches.data.map((b) => (
                <th key={b.id} className="center">
                  {b.name}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {products.loading && products.data.length === 0 && (
              <tr>
                <td colSpan={4 + branches.data.length} className="muted">
                  Loading…
                </td>
              </tr>
            )}
            {!products.loading && products.data.length === 0 && (
              <tr>
                <td colSpan={4 + branches.data.length} className="muted">
                  No products match these filters.
                </td>
              </tr>
            )}
            {products.data.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                branches={branches.data}
                categoryName={categoryName(product.categoryId)}
                onToggle={(branch, available) => run(() => setProductAvailability(product.id, branch, available))}
                onDelete={() => confirmDelete(product)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Checkboxes switch a product on or off at each branch. Changes reach the mobile app in real time.
      </p>
    </section>
  );
}

interface ProductRowProps {
  product: Product;
  branches: Branch[];
  categoryName: string;
  onToggle: (branchId: string, available: boolean) => void;
  onDelete: () => void;
}

/** One table row. */
function ProductRow({ product, branches, categoryName, onToggle, onDelete }: ProductRowProps) {
  const optionCount = product.optionGroups.reduce((sum, g) => sum + g.choices.length, 0);
  return (
    <tr>
      <td>
        <Link to={`/products/${product.id}`} className="product-cell">
          <span className="emoji">{product.emoji}</span>
          <span>
            {product.name}
            {optionCount > 0 && <span className="muted small"> · {optionCount} options</span>}
          </span>
        </Link>
      </td>
      <td>{categoryName}</td>
      <td className="num">{formatMoney(product.basePrice)}</td>
      {branches.map((branch) => (
        <td key={branch.id} className="center">
          <input
            type="checkbox"
            aria-label={`${product.name} available at ${branch.name}`}
            checked={product.availableAt.includes(branch.id)}
            onChange={(e) => onToggle(branch.id, e.target.checked)}
          />
        </td>
      ))}
      <td className="actions">
        <Link to={`/products/${product.id}`}>Edit</Link>
        <button className="link danger" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}
