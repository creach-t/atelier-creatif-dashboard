import React, { useState } from 'react';
import { ConnectKofi } from './ConnectKofi';
import { ImportHistory } from './ImportHistory';
import { apiClient } from '../../api/client';

export const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState('kofi'); // 'kofi' | 'import'

  const finish = async () => {
    try {
      await apiClient.patch('/profile', { onboarding_completed: true });
    } finally {
      onComplete();
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25 p-4">
      {step === 'kofi' && <ConnectKofi onDone={() => setStep('import')} onSkip={() => setStep('import')} />}
      {step === 'import' && <ImportHistory onDone={finish} onSkip={finish} />}
    </div>
  );
};
