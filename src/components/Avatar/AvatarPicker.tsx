'use client';

import { Avatar } from '@/components/Avatar/Avatar';
import { cn } from '@/lib/client/cn';
import { AVATAR_CONTENT_TYPES, AVATAR_MAX_BYTES } from '@/utils/avatar';
import { Camera } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';

const AVATAR_ACCEPT = Object.values(AVATAR_CONTENT_TYPES).join(',');

interface AvatarPickerProps {
  src: string;
  hasAvatar: boolean;
  name: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  onFile: (file: File) => void;
  onFileTooLarge?: () => void;
}

/** 点头像选图；超过 5MB 不回调 onFile。空图示相机，已有图示角标。 */
export function AvatarPicker({
  src,
  hasAvatar,
  name,
  ariaLabel,
  disabled,
  className,
  onFile,
  onFileTooLarge,
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showCenterCamera = !hasAvatar && name.trim().length === 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled) return;
    if (file.size > AVATAR_MAX_BYTES) {
      onFileTooLarge?.();
      return;
    }
    onFile(file);
  };

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-busy={disabled}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative shrink-0 rounded-lg hover:opacity-80 active:opacity-80 disabled:opacity-40',
          className,
        )}
      >
        <Avatar src={src} hasAvatar={hasAvatar} name={name} size="lg" />
        {showCenterCamera && (
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-lg text-muted-foreground',
            )}
            aria-hidden
          >
            <Camera className={cn('h-6 w-6')} />
          </span>
        )}
        {!showCenterCamera && (
          <span
            className={cn(
              'absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-md',
              'bg-foreground text-background',
            )}
            aria-hidden
          >
            <Camera className={cn('h-3 w-3')} />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className={cn('hidden')}
        onChange={handleChange}
      />
    </>
  );
}
