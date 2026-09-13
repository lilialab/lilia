import { userAvatarUrl } from '@/client-api/auth';
import { characterAvatarUrl } from '@/client-api/characters';
import type { HistoryMessage } from '@/client-api/sessions';
import { Avatar } from '@/components/Avatar';
import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

interface MessageRowProps {
  message: HistoryMessage;
  hideSpeakerName: boolean;
  children: ReactNode;
}

/** 气泡行：头像在外侧，名字和气泡在内侧。 */
export function MessageRow({ message, hideSpeakerName, children }: MessageRowProps) {
  const isUser = message.role === 'user';
  const { metadata } = message;
  let src = '';
  if (metadata.speakerId) {
    if (isUser) {
      src = userAvatarUrl(metadata.speakerId, metadata.avatarUpdatedAt);
    } else {
      src = characterAvatarUrl(metadata.speakerId, metadata.avatarUpdatedAt);
    }
  }

  return (
    <div className={cn('flex items-start gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar src={src} hasAvatar={metadata.hasAvatar} name={metadata.name ?? ''} size="sm" />
      <div
        className={cn(
          'flex min-w-0 max-w-[85%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {!hideSpeakerName && metadata.name && (
          <span className={cn('truncate px-1 text-xs text-muted-foreground')}>{metadata.name}</span>
        )}
        {children}
      </div>
    </div>
  );
}
