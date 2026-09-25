'use client';

import { fieldSurfaceClass, formControlClass } from '@/components/Form/form-control';
import { fieldHintClass, fieldLabelClass } from '@/components/Form/form-label';
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
  hint?: string;
  children: ReactNode;
  className?: string;
}

interface FormSectionProps {
  title?: string;
  children: ReactNode;
}

interface FormRowProps {
  children: ReactNode;
}

interface FormSegmentedProps {
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  className?: string;
}

interface FormInputProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  autoComplete?: string;
  autoCapitalize?: 'off';
  autoCorrect?: 'off';
  spellCheck?: boolean;
  autoFocus?: boolean;
  readOnly?: boolean;
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
  /** 输入框右侧固定单位（如 cm / 岁）；纯展示，不进 value。 */
  unit?: string;
  className?: string;
}

interface FormTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface FormSubmitProps {
  children: ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  className?: string;
}

interface FormCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
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

/** 表单字段：标签 + 控件 + 可选说明。 */
function FormField({ label, required, hint, children, className }: FormFieldProps) {
  return (
    <FormFieldContext.Provider value={{ required }}>
      <label
        className={cn(
          'mt-4 block first:mt-0',
          fieldLabelClass,
          className,
        )}
      >
        {required && (
          <span className={cn('mr-0.5 text-destructive')} aria-hidden>
            *
          </span>
        )}
        {label}
        {children}
        {hint && <span className={fieldHintClass}>{hint}</span>}
      </label>
    </FormFieldContext.Provider>
  );
}

/** 表单分段：整块白底卡片，横向铺满；标题可选。 */
function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className={cn('mt-3 bg-background px-4 pb-4 pt-3 first:mt-0')}>
      {title && (
        <h2
          className={cn(
            '-mx-4 border-b border-border px-4 pb-3 text-base font-semibold text-foreground',
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/** 并排两个字段。 */
function FormRow({ children }: FormRowProps) {
  return <div className={cn('mt-4 grid grid-cols-2 gap-3 [&>label]:mt-0')}>{children}</div>;
}

/** 互斥选项按钮。 */
function FormSegmented({ value, onChange, options, className }: FormSegmentedProps) {
  const { required } = useFormField();

  return (
    <div
      role="radiogroup"
      aria-required={required}
      className={cn('mt-1.5 grid grid-cols-2 gap-2', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md border py-2 text-sm font-medium',
              selected
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-foreground hover:bg-row-hover active:bg-row-hover',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** 单行文本。 */
function FormInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  autoFocus,
  readOnly,
  className,
}: FormInputProps) {
  const { required } = useFormField();

  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      aria-required={required}
      autoComplete={autoComplete}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
      autoFocus={autoFocus}
      readOnly={readOnly}
      className={cn(
        formControlClass,
        readOnly && 'cursor-default bg-transparent text-muted-foreground',
        className,
      )}
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

/** 多行文本。 */
function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: FormTextareaProps) {
  const { required } = useFormField();

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-required={required}
      className={cn(formControlClass, 'resize-y', className)}
    />
  );
}

/**
 * 非负整数输入（空串表示未填）。`unit` 只做右侧固定展示：手机仍走数字键盘，
 * 输入框只收纯数字，单位不进 value、不影响校验。
 */
function FormNumber({
  value,
  onChange,
  placeholder,
  max,
  unit,
  className,
}: FormNumberProps) {
  const { required } = useFormField();

  return (
    <div className={cn('relative mt-1.5')}>
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
        className={cn(fieldSurfaceClass, 'w-full', unit && 'pr-10', className)}
      />
      {unit && (
        <span
          className={cn(
            'pointer-events-none absolute inset-y-0 right-3 flex items-center text-base text-muted-foreground',
          )}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

/** 主操作提交按钮。 */
function FormSubmit({ children, disabled, variant = 'default', className }: FormSubmitProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        'w-full rounded-md py-2.5 text-sm font-medium',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'danger'
          ? 'bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-hover'
          : 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** 带文案的勾选。 */
function FormCheckbox({
  checked,
  onChange,
  children,
  disabled,
  className,
}: FormCheckboxProps) {
  return (
    <label
      className={cn('mt-4 flex items-start gap-3 text-sm text-foreground', className)}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={cn('mt-0.5 h-4 w-4 shrink-0 rounded border-border')}
      />
      <span>{children}</span>
    </label>
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

/** 表单：字段用 Form.Field，控件用 Form.Input / Select / Number / Textarea / Checkbox / StringList / Segmented / Submit。 */
export const Form = Object.assign(FormRoot, {
  Field: FormField,
  Section: FormSection,
  Row: FormRow,
  Input: FormInput,
  Select: FormSelect,
  Segmented: FormSegmented,
  Number: FormNumber,
  Textarea: FormTextarea,
  Checkbox: FormCheckbox,
  StringList: FormStringList,
  Submit: FormSubmit,
});
