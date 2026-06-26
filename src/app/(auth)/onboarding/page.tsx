'use client';

import { useState } from 'react';
import { Stepper } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { PathChoice } from '@/components/onboarding/PathChoice';
import { FirstCoralForm } from '@/components/onboarding/FirstCoralForm';
import { SellerSetupForm } from '@/components/onboarding/SellerSetupForm';
import styles from '@/components/onboarding/onboarding.module.css';

type Path = 'hobbyist' | 'seller';

// step 0 = Account (always done on this page)
// step 1 = Your path  ← starts here
// step 2 = Setup
export default function OnboardingPage() {
  const [active, setActive] = useState(1);
  const [path, setPath] = useState<Path>('hobbyist');

  function handleContinue() {
    setActive(2);
  }

  return (
    <div className={styles.page}>
      <Stepper
        active={active}
        style={{ width: '100%', maxWidth: 420 }}
        completedIcon={<IconCheck size={14} stroke={2.6} />}
      >
        <Stepper.Step label="Account" />
        <Stepper.Step label="Your path" />
        <Stepper.Step label="Setup" />
      </Stepper>

      {active === 1 && (
        <PathChoice
          selected={path}
          onSelect={setPath}
          onContinue={handleContinue}
        />
      )}

      {active === 2 && path === 'hobbyist' && <FirstCoralForm />}
      {active === 2 && path === 'seller' && <SellerSetupForm />}
    </div>
  );
}
