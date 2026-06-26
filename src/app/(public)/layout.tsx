import { AppShellWrapper } from '@/components/shell/AppShellWrapper';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AppShellWrapper>{children}</AppShellWrapper>;
}
