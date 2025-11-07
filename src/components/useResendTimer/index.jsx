import { useState, useEffect } from 'react';

export const useResendTimer = (initialTime = 30) => {
  const [resendTimer, setResendTimer] = useState(initialTime);
  const [canResend, setCanResend] = useState(false);

  const startTimer = () => {
    setResendTimer(initialTime);
    setCanResend(false);
  };

  const resetTimer = () => {
    setResendTimer(0);
    setCanResend(true);
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  return {
    resendTimer,
    canResend,
    startTimer,
    resetTimer,
  };
};