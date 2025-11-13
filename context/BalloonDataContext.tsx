'use client';

// Context for managing balloon data and UI state
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BalloonTrack } from '@/lib/types';
import { loadBalloonData } from '@/lib/data/windborne';
/**
 * BalloonDataContext
 *
 * Global state management for balloon tracking data
 * Loads WindBorne data once on mount and provides it to all components
 */
interface BalloonDataContextType {
  // Data
  balloons: BalloonTrack[];
  isLoading: boolean;
  error: string | null;

  // UI State
  selectedBalloonId: number | null;
  trackHours: number;

  // Actions
  selectBalloon: (id: number | null) => void;
  setTrackHours: (hours: number) => void;
}

const BalloonDataContext = createContext<BalloonDataContextType | undefined>(undefined);

interface BalloonDataProviderProps {
  children: ReactNode;
}

export function BalloonDataProvider({ children }: BalloonDataProviderProps) {
  const [balloons, setBalloons] = useState<BalloonTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBalloonId, setSelectedBalloonId] = useState<number | null>(null);
  const [trackHours, setTrackHours] = useState<number>(6); // Default: show last 6 hours

  // Load balloon data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('BalloonDataProvider: Starting data load...');

        const data = await loadBalloonData();
        setBalloons(data);

        console.log(`BalloonDataProvider: Loaded ${data.length} balloons`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load balloon data';
        setError(errorMessage);
        console.error('BalloonDataProvider: Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const value: BalloonDataContextType = {
    balloons,
    isLoading,
    error,
    selectedBalloonId,
    trackHours,
    selectBalloon: setSelectedBalloonId,
    setTrackHours,
  };

  return (
    <BalloonDataContext.Provider value={value}>
      {children}
    </BalloonDataContext.Provider>
  );
}

/**
 * Hook to access balloon data context
 */
export function useBalloonData() {
  const context = useContext(BalloonDataContext);
  if (context === undefined) {
    throw new Error('useBalloonData must be used within a BalloonDataProvider');
  }
  return context;
}
