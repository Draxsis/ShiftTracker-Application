
import React, { useState, useEffect, useCallback } from 'react';
import { SHIFT_DURATION_SECONDS } from './constants';
import { TimerStatus } from './types';
import TimerDisplay from './components/TimerDisplay';
import EndTimeDisplay from './components/EndTimeDisplay';

// Helper function to format seconds into HH:MM:SS
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.Idle);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(SHIFT_DURATION_SECONDS);
  const [targetEndTime, setTargetEndTime] = useState<Date | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'default')
  );

  useEffect(() => {
    // This effect ensures that if the user changes notification permissions
    // directly in the browser settings while the app is open, the UI reflects it.
    // However, direct Notification.permission updates might not always trigger re-renders.
    // The main path for updating this state is through requestNotificationPermission.
    if (typeof Notification !== 'undefined' && Notification.permission !== notificationPermission) {
        setNotificationPermission(Notification.permission);
    }
  }, [notificationPermission]); // Re-check if the component thinks permission changed.

  const requestNotificationPermissionHandler = async () => {
    if (typeof Notification === 'undefined') {
      alert('Desktop notifications are not supported in this browser.');
      return;
    }
    if (Notification.permission === 'granted') {
      // alert('Notifications are already enabled.');
      return;
    }
    if (Notification.permission === 'denied') {
      alert('Notifications have been denied. Please enable them in your browser settings to receive shift completion alerts.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // Optional: Show a confirmation notification
        // new Notification('Success!', { body: 'Notifications have been enabled.' });
      } else if (permission === 'denied') {
        alert('Notifications have been denied. You will not receive alerts when your shift ends.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('There was an issue requesting notification permission.');
    }
  };

  const showShiftCompletionNotification = useCallback(() => {
    if (notificationPermission === 'granted') {
      new Notification('Shift Complete!', {
        body: 'Your shift timer has finished. Time to clock out!',
        icon: './logo192.png', // Optional: Re-use PWA icon
      });
    }
  }, [notificationPermission]);

  const startTimer = useCallback(() => {
    const newEndTime = new Date(Date.now() + SHIFT_DURATION_SECONDS * 1000);
    setTargetEndTime(newEndTime);
    setRemainingSeconds(SHIFT_DURATION_SECONDS);
    setStatus(TimerStatus.Running);
  }, []);

  useEffect(() => {
    if (status !== TimerStatus.Running || !targetEndTime) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const newRemaining = Math.max(0, Math.round((targetEndTime.getTime() - now) / 1000));
      setRemainingSeconds(newRemaining);

      if (newRemaining === 0) {
        setStatus(TimerStatus.Finished);
        showShiftCompletionNotification();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status, targetEndTime, showShiftCompletionNotification]);

  const handleButtonClick = () => {
    if (status === TimerStatus.Idle || status === TimerStatus.Finished) {
      startTimer();
    }
  };

  const getButtonText = () => {
    switch (status) {
      case TimerStatus.Idle:
        return 'Start Shift';
      case TimerStatus.Running:
        return 'Shift in Progress...';
      case TimerStatus.Finished:
        return 'Start New Shift';
      default:
        return 'Start Shift';
    }
  };

  const displayedEndTimeString = targetEndTime && (status === TimerStatus.Running || status === TimerStatus.Finished)
    ? targetEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex flex-col items-center justify-center p-4 font-sans antialiased">
      <div className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-md text-center border border-slate-700">
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 tracking-tight">Shift Tracker</h1>
        </header>
        
        <main>
          <section aria-labelledby="timer-heading" className="mb-6">
            <h2 id="timer-heading" className="sr-only">Time Remaining</h2>
            <TimerDisplay time={formatDuration(remainingSeconds)} />
            <p className="text-sm text-slate-400 -mt-2">Time Remaining</p>
          </section>
          
          <section aria-labelledby="endtime-heading" className="mb-10">
            <h2 id="endtime-heading" className="sr-only">Estimated End Time</h2>
            <EndTimeDisplay endTimeString={displayedEndTimeString} />
          </section>
          
          <button
            onClick={handleButtonClick}
            disabled={status === TimerStatus.Running}
            className={`w-full px-6 py-3.5 text-lg font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-4
              ${status === TimerStatus.Running 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed ring-slate-600' 
                : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400/50 active:bg-sky-700 transform hover:scale-105'
              }`}
            aria-live="polite" // Announces changes in button text for screen readers
          >
            {getButtonText()}
          </button>

          {typeof Notification !== 'undefined' && (
            <button
              onClick={requestNotificationPermissionHandler}
              disabled={notificationPermission === 'granted' || notificationPermission === 'denied'}
              className={`w-full px-6 py-3 text-md font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 mt-4
                ${notificationPermission === 'granted' 
                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-default ring-green-500/50' 
                  : notificationPermission === 'denied'
                  ? 'bg-red-700 hover:bg-red-800 text-slate-300 cursor-not-allowed ring-red-600/50'
                  : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400/50 active:bg-blue-700 transform hover:scale-105'
                }`}
              aria-live="polite" 
            >
              {notificationPermission === 'granted' ? '✓ Notifications Enabled' :
               notificationPermission === 'denied' ? '✗ Notifications Denied' :
               'Enable Notifications'}
            </button>
          )}
        </main>
        {status === TimerStatus.Finished && (
             <p className="mt-8 text-xl text-green-400 font-semibold animate-pulse">🎉 Shift Complete! Well done! 🎉</p>
        )}
      </div>
      <footer className="mt-10 text-center text-slate-500 text-sm">
        <p>Track your work shifts with ease. Stay productive!</p>
      </footer>
    </div>
  );
};

export default App;
