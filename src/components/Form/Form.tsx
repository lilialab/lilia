'use client';

import { formControlClass } from '@/components/Form/form-control';
import { FormStringList } from '@/components/Form/FormStringList';
import { cn } from '@/lib/client/cn';
import {
  createContext,
  type FormHTMLAttributes,
  type ReactNode,
  type SubmitEvent,
  useContext,
} from 'react';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

interface FormInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: 'off';
  autoCorrect?: 'off';
  spellCheck?: boolean;
  autoFocus?: boolean;
  className?: string;
}

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  emptyLabel?: string;
  className?: string;
}

interface FormNumberProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  max?: number;
  className?: string;
}

interface FormSubmitProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

interface FormFieldContextValue {
  required: boolean | undefined;
}

const FormFieldContext = createContext<FormFieldContextValue>({ required: undefined });

function useFormField(): FormFieldContextValue {
  return useContext(FormFieldContext);
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

/** 表单字段：标签 + 控件。 */
function FormField({ label, required, children }: FormFieldProps) {
  return (
    <FormFieldContext.Provider value={{ required }}>
      <label className={cn('mt-4 block text-xs font-medium text-muted-foreground first:mt-0')}>
        {required && (
          <span className={cn('mr-0.5 text-destructive')} aria-hidden>
            *
          </span>
        )}
        {label}
        {children}
      </label>
    </FormFieldContext.Provider>
  );
}

/** 单行文本。 */
function FormInput({
  value,
  onChange,
  placeholder,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  autoFocus,
  className,
}: FormInputProps) {
  const { required } = useFormField();

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-required={required}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
      autoFocus={autoFocus}
      className={cn(formControlClass, className)}
    />
  );
}

/** 原生下拉。 */
function FormSelect({
  value,
  onChange,
  options,
  emptyLabel,
  className,
}: FormSelectProps) {
  const { required } = useFormField();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-required={required}
      className={cn(formControlClass, className)}
    >
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** 非负整数输入（空串表示未填）。 */
function FormNumber({
  value,
  onChange,
  placeholder,
  max,
  className,
}: FormNumberProps) {
  const { required } = useFormField();

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      placeholder={placeholder}
      aria-required={required}
      maxLength={max === undefined ? undefined : String(max).length}
      onChange={(e) => {
        const next = e.target.value;
        if (next === '' || /^\d+$/.test(next)) onChange(next);
      }}
      className={cn(formControlClass, className)}
    />
  );
}

/** 主操作提交按钮。 */
function FormSubmit({ children, disabled, className }: FormSubmitProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        'w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground',
        'hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}

function FormRoot({ children, onSubmit, className, ...props }: FormProps) {
  return (
    <form {...props} onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 表单：字段用 Form.Field，控件用 Form.Input / Select / Number / StringList / Submit。 */
export const Form = Object.assign(FormRoot, {
  Field: FormField,
  Input: FormInput,
  Select: FormSelect,
  Number: FormNumber,
  StringList: FormStringList,
  Submit: FormSubmit,
});
