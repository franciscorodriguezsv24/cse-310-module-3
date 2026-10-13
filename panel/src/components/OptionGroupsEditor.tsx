import { emptyChoice, emptyGroup, type ChoiceForm, type FormErrors, type GroupForm } from '../lib/productForm';
import type { Branch } from '../types';

interface Props {
  groups: GroupForm[];
  branches: Branch[];
  errors: FormErrors;
  onChange: (groups: GroupForm[]) => void;
}

/** Edits a product's option groups (e.g. Size, Extras) and their choices, including per-branch availability. */
export function OptionGroupsEditor({ groups, branches, errors, onChange }: Props) {
  const updateGroup = (g: number, patch: Partial<GroupForm>) =>
    onChange(groups.map((group, i) => (i === g ? { ...group, ...patch } : group)));

  const updateChoice = (g: number, c: number, patch: Partial<ChoiceForm>) =>
    updateGroup(g, { choices: groups[g].choices.map((choice, i) => (i === c ? { ...choice, ...patch } : choice)) });

  const removeGroup = (g: number) => {
    if (window.confirm(`Remove the option group "${groups[g].name || 'untitled'}" and all its choices?`)) {
      onChange(groups.filter((_, i) => i !== g));
    }
  };

  const removeChoice = (g: number, c: number) => {
    if (window.confirm(`Remove the option "${groups[g].choices[c].name || 'untitled'}"?`)) {
      updateGroup(g, { choices: groups[g].choices.filter((_, i) => i !== c) });
    }
  };

  /** Single-choice groups have at most one default, so checking one unchecks the others. */
  const setDefault = (g: number, c: number, isDefault: boolean) => {
    const group = groups[g];
    updateGroup(g, {
      choices: group.choices.map((choice, i) => {
        if (i === c) return { ...choice, isDefault };
        return group.type === 'single' && isDefault ? { ...choice, isDefault: false } : choice;
      }),
    });
  };

  const toggleChoiceBranch = (g: number, c: number, branchId: string, available: boolean) => {
    const current = groups[g].choices[c].unavailableAt;
    updateChoice(g, c, {
      unavailableAt: available ? current.filter((b) => b !== branchId) : [...current, branchId],
    });
  };

  return (
    <fieldset className="card stack">
      <legend>Options</legend>
      {groups.length === 0 && <p className="muted">No options. Customers order this product as is.</p>}

      {groups.map((group, g) => (
        <div key={group.key} className="option-group stack">
          <div className="row wrap">
            <label>
              Group name
              <input
                value={group.name}
                placeholder="Size"
                onChange={(e) => updateGroup(g, { name: e.target.value })}
                aria-invalid={!!errors[`groups.${g}.name`]}
              />
              {errors[`groups.${g}.name`] && <span className="error">{errors[`groups.${g}.name`]}</span>}
            </label>
            <label>
              Type
              <select
                value={group.type}
                onChange={(e) => updateGroup(g, { type: e.target.value as GroupForm['type'] })}
              >
                <option value="single">Pick exactly one</option>
                <option value="multiple">Pick up to a max</option>
              </select>
            </label>
            {group.type === 'multiple' && (
              <label>
                Max
                <input
                  className="short"
                  inputMode="numeric"
                  value={group.max}
                  onChange={(e) => updateGroup(g, { max: e.target.value })}
                  aria-invalid={!!errors[`groups.${g}.max`]}
                />
                {errors[`groups.${g}.max`] && <span className="error">{errors[`groups.${g}.max`]}</span>}
              </label>
            )}
            <span className="spacer" />
            <button type="button" className="link danger" onClick={() => removeGroup(g)}>
              Remove group
            </button>
          </div>
          {errors[`groups.${g}`] && <p className="error">{errors[`groups.${g}`]}</p>}

          <div className="table-wrap">
            <table className="compact">
              <thead>
                <tr>
                  <th>Choice</th>
                  <th>Price change ($)</th>
                  <th className="center">Default</th>
                  {branches.map((b) => (
                    <th key={b.id} className="center">
                      {b.name}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {group.choices.map((choice, c) => {
                  const nameError = errors[`groups.${g}.choices.${c}.name`];
                  const priceError = errors[`groups.${g}.choices.${c}.priceDelta`];
                  return (
                    <tr key={choice.key}>
                      <td>
                        <input
                          value={choice.name}
                          placeholder="12 pieces"
                          onChange={(e) => updateChoice(g, c, { name: e.target.value })}
                          aria-invalid={!!nameError}
                        />
                        {nameError && <span className="error">{nameError}</span>}
                      </td>
                      <td>
                        <input
                          className="short"
                          inputMode="decimal"
                          value={choice.priceDelta}
                          onChange={(e) => updateChoice(g, c, { priceDelta: e.target.value })}
                          aria-invalid={!!priceError}
                        />
                        {priceError && <span className="error">{priceError}</span>}
                      </td>
                      <td className="center">
                        <input
                          type="checkbox"
                          aria-label={`${choice.name} is preselected`}
                          checked={choice.isDefault}
                          onChange={(e) => setDefault(g, c, e.target.checked)}
                        />
                      </td>
                      {branches.map((branch) => (
                        <td key={branch.id} className="center">
                          <input
                            type="checkbox"
                            aria-label={`${choice.name} available at ${branch.name}`}
                            checked={!choice.unavailableAt.includes(branch.id)}
                            onChange={(e) => toggleChoiceBranch(g, c, branch.id, e.target.checked)}
                          />
                        </td>
                      ))}
                      <td>
                        <button type="button" className="link danger" onClick={() => removeChoice(g, c)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div>
            <button
              type="button"
              className="ghost"
              onClick={() => updateGroup(g, { choices: [...group.choices, emptyChoice()] })}
            >
              + Add choice
            </button>
          </div>
        </div>
      ))}

      <div>
        <button type="button" className="ghost" onClick={() => onChange([...groups, emptyGroup()])}>
          + Add option group
        </button>
      </div>
    </fieldset>
  );
}
