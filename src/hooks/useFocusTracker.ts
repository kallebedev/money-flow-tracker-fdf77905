import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

export interface FocusData {
  totalFocusSeconds: number;
  totalAwaySeconds: number;
  distractions: number;
  pauses: number;
  focusScore: number;
}

const STORAGE_KEY_PREFIX = 'mf_focus_';

export const getTodayFocusData = (): FocusData => {
  const key = STORAGE_KEY_PREFIX + format(new Date(), 'yyyy-MM-dd');
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { totalFocusSeconds: 0, totalAwaySeconds: 0, distractions: 0, pauses: 0, focusScore: 100 };
};

const saveFocusData = (data: FocusData) => {
  const key = STORAGE_KEY_PREFIX + format(new Date(), 'yyyy-MM-dd');
  localStorage.setItem(key, JSON.stringify(data));
};

export const useFocusTracker = (isActive: boolean) => {
  const [data, setData] = useState<FocusData>(getTodayFocusData());
  const isVisibleRef = useRef(!document.hidden);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const handleVisibility = () => {
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = !document.hidden;
      if (wasVisible && !isVisibleRef.current) {
        setData(prev => {
          const next = { ...prev, distractions: prev.distractions + 1 };
          saveFocusData(next);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const focus = isVisibleRef.current ? prev.totalFocusSeconds + 1 : prev.totalFocusSeconds;
        const away = !isVisibleRef.current ? prev.totalAwaySeconds + 1 : prev.totalAwaySeconds;
        const total = focus + away;
        const raw = total > 0 ? (focus / total) * 100 : 100;
        const score = Math.max(0, Math.min(100, Math.round(raw - prev.distractions * 3 - prev.pauses)));
        const next = { ...prev, totalFocusSeconds: focus, totalAwaySeconds: away, focusScore: score };
        saveFocusData(next);
        return next;
      });
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const recordPause = useCallback(() => {
    setData(prev => {
      const next = { ...prev, pauses: prev.pauses + 1 };
      saveFocusData(next);
      return next;
    });
  }, []);

  return { ...data, recordPause };
};
