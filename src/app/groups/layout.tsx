import { RequireAuth } from '@/components/RequireAuth';

interface GroupsLayoutProps {
  children: React.ReactNode;
}

export default function GroupsLayout({ children }: GroupsLayoutProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
