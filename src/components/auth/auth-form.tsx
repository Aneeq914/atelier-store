"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { FormState } from "@/lib/auth-actions";
import { validateField, validateForm, type AuthField, type FieldErrors, type FormKind } from "@/lib/auth-validation";

export type FormField = {
  name: AuthField;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  hint?: string;
};

type Props = {
  /** Which rules apply (shared with the Server Action). */
  kind: FormKind;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FormField[];
  submit: string;
  pending: string;
  /** Same-site path to return to after success (validated again on the server). */
  next?: string;
  /** Starting values, e.g. the current name on the account details form. */
  initialValues?: Partial<Record<AuthField, string>>;
};

/**
 * Auth and account form. Without JavaScript it's a plain form posting to a
 * Server Action (which validates everything). With JavaScript it also checks
 * fields before sending, shows each problem under its field, clears it as it's
 * fixed, focuses the first problem, and shows pending and saved states.
 */
export function AuthForm({ kind, action, fields, submit, pending, next, initialValues }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});
  // Browser-side errors apply until the next server response replaces `state`.
  const [client, setClient] = useState<{ for: FormState; errors: FieldErrors } | null>(null);
  const [dismissedSaved, setDismissedSaved] = useState<FormState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const clientActive = client?.for === state;
  const fieldErrors = clientActive ? client.errors : (state.fieldErrors ?? {});
  const formError = clientActive ? undefined : state.formError;
  const saved = !clientActive && dismissedSaved !== state ? state.saved : undefined;

  const focusFirstError = (errors: FieldErrors) => {
    const first = fields.find((field) => errors[field.name]);
    if (first) formRef.current?.querySelector<HTMLInputElement>(`[name="${first.name}"]`)?.focus();
  };

  // A server response with field errors moves focus to the first one.
  useEffect(() => {
    if (state.fieldErrors) focusFirstError(state.fieldErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per server response
  }, [state]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map((field) => [field.name, String(data.get(field.name) ?? "")]));
    const errors = validateForm(kind, values);
    if (Object.keys(errors).length) {
      event.preventDefault(); // don't send; show what to fix
      setClient({ for: state, errors });
      focusFirstError(errors);
    } else {
      setClient(null);
    }
  };

  // Re-check a field as it's edited, but only once it's showing an error.
  const onFieldInput = (name: AuthField, value: string) => {
    if (state.saved) setDismissedSaved(state);
    if (!fieldErrors[name]) return;
    setClient({ for: state, errors: { ...fieldErrors, [name]: validateField(kind, name, value) } });
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-busy={isPending || undefined}
      className="flex flex-col gap-5"
    >
      {next && <input type="hidden" name="next" value={next} />}

      {formError && (
        <div role="alert" className="type-caption flex flex-col gap-1 border-l-2 border-error pl-3">
          <p className="text-error">{formError.message}</p>
          {formError.link && (
            <Link href={formError.link.href} className="link self-start">
              {formError.link.label}
            </Link>
          )}
        </div>
      )}

      {fields.map((field) => (
        <FormFieldInput
          key={field.name}
          field={field}
          error={fieldErrors[field.name]}
          defaultValue={field.type === "password" ? undefined : (state.values?.[field.name as "name" | "email"] ?? initialValues?.[field.name])}
          onInput={(value) => onFieldInput(field.name, value)}
        />
      ))}

      {saved && (
        <p role="status" className="type-caption">
          {saved}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? pending : submit}
      </button>
    </form>
  );
}

function FormFieldInput({
  field,
  error,
  defaultValue,
  onInput,
}: {
  field: FormField;
  error?: string;
  defaultValue?: string;
  onInput: (value: string) => void;
}) {
  const [shown, setShown] = useState(false);
  // useId, not a fixed id: Next keeps the previous page hidden in the document,
  // so two forms (e.g. sign-up and account details) can both be present.
  const id = `${useId()}-${field.name}`;
  const hintId = field.hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const isPassword = field.type === "password";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-caption-strong">
        {field.label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={field.name}
          type={isPassword && shown ? "text" : field.type}
          required
          autoComplete={field.autoComplete}
          autoCapitalize={field.type === "text" ? "words" : "none"}
          spellCheck={false}
          defaultValue={defaultValue}
          onInput={(event) => onInput(event.currentTarget.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          className={`field ${isPassword ? "pr-20" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((value) => !value)}
            aria-controls={id}
            aria-label={shown ? "Hide password" : "Show password"}
            className="type-caption link-quiet absolute inset-y-0 right-0 px-4"
          >
            {shown ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="type-caption text-error">
          {error}
        </p>
      )}
      {field.hint && !error && (
        <p id={hintId} className="type-caption text-muted">
          {field.hint}
        </p>
      )}
    </div>
  );
}
