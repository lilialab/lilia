import { RequireAuth } from '@/components/RequireAuth';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
