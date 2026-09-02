import { APP_VERSION } from '@/lib/app-version';
import { SettingsScreen } from './SettingsScreen';

export default function SettingsPage() {
  return <SettingsScreen version={APP_VERSION} />;
}
