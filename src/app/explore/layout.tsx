import { RequireAuth } from '@/components/RequireAuth';

interface ExploreLayoutProps {
  children: React.ReactNode;
}

export default function ExploreLayout({ children }: ExploreLayoutProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
