import type { Metadata } from 'next';
import { parsePrivacyReturnTo } from './privacy-return';
import { PrivacyPolicyBody } from './PrivacyPolicyBody';
import { PrivacyScreen } from './PrivacyScreen';

export const metadata: Metadata = {
  title: 'Privacy Policy · Lilia',
  description: 'What Lilia stores, how we protect it, and what deletion covers.',
};

export default async function PrivacyPage(props: PageProps<'/privacy'>) {
  const { from } = await props.searchParams;
  return (
    <PrivacyScreen returnTo={parsePrivacyReturnTo(from)}>
      <PrivacyPolicyBody />
    </PrivacyScreen>
  );
}
