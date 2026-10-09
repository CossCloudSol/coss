// A small form hook for the lead forms: the slice of react-hook-form they used
// (register, handleSubmit, reset, watch, formState.errors), on plain validation
// (src/lib/lead-form-rules.ts). Inputs stay uncontrolled; values are read with FormData
// on submit, so the markup and its styling didn't need to change.
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { validateLead, type LeadSchema } from '@/lib/lead-form-rules';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export function useLeadForm<V extends Record<string, string>>(schema: LeadSchema<V>) {
  type K = keyof V & string;
  const [errors, setErrors] = useState<Partial<Record<K, { message: string }>>>({});
  const [watched, setWatched] = useState<Partial<Record<K, string>>>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  /** Spread on an input/select/textarea: names it and tracks it for watch(); a change clears its error. */
  function register(name: K) {
    return {
      name,
      onChange: (e: ChangeEvent<Field>) => {
        const t = e.target as HTMLInputElement;
        if (t.type !== 'radio' || t.checked) setWatched((w) => ({ ...w, [name]: t.value }));
        setErrors((current) => {
          if (!current[name]) return current;
          const next = { ...current };
          delete next[name];
          return next;
        });
      },
    };
  }

  /** onSubmit handler: validates the form's current values; calls fn only when all pass. */
  function handleSubmit(fn: (values: V) => void | Promise<void>) {
    return (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      formRef.current = e.currentTarget;
      const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
      const { values, errors: found } = validateLead(schema, raw);
      const keys = Object.keys(found) as K[];
      setErrors(Object.fromEntries(keys.map((k) => [k, { message: found[k] as string }])) as Partial<Record<K, { message: string }>>);
      if (keys.length === 0) void fn(values);
    };
  }

  function reset() {
    formRef.current?.reset();
    setWatched({});
    setErrors({});
  }

  const watch = (name: K) => watched[name];

  return { register, handleSubmit, reset, watch, formState: { errors } };
}
