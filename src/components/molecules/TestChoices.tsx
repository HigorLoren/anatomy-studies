type Props = {
  title: string; options: Record<string, string>; selected: string[];
  onChange: (values: string[]) => void;
};
export function TestChoices({ title, options, selected, onChange }: Props) {
  const values = Object.keys(options);
  return <fieldset class="test-choices">
    <legend>{title}</legend>
    <div class="test-field-heading">
      <button type="button" onClick={() => onChange(selected.length === values.length ? [] : values)}>
        {selected.length === values.length ? "Limpar seleção" : "Selecionar todas"}
      </button>
    </div>
    <div class="test-choice-list">
      {Object.entries(options).map(([value, label]) => <label key={value}
        class={selected.includes(value) ? "test-choice is-selected" : "test-choice"}>
        <input type="checkbox" checked={selected.includes(value)} onChange={() =>
          onChange(selected.includes(value)
            ? selected.filter(item => item !== value) : [...selected, value])} />
        <span>{label}</span>
      </label>)}
    </div>
  </fieldset>;
}
