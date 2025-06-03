import { createContext, useContext, useState, ReactNode } from 'react';
import { Household } from '../types';
import { householdApi } from '../lib/api';
import { useApi } from '../hooks/useApi';

interface HouseholdContextType {
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household | null) => void;
  households: Household[];
  isLoading: boolean;
  error: Error | null;
  refreshHouseholds: () => Promise<Household[]>;
  createHousehold: (name: string) => Promise<Household>;
  updateHousehold: (id: string, data: { name?: string; settings?: any }) => Promise<Household>;
  inviteMember: (email: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);

  const {
    data: households = [],
    error,
    isLoading,
    execute: refreshHouseholds,
  } = useApi<Household[], []>(() => householdApi.getAll(), {
    successMessage: 'Households refreshed successfully',
  });

  const { execute: createHousehold } = useApi<Household, [string]>(
    (name: string) => householdApi.create({ name }),
    {
      successMessage: 'Household created successfully',
      onSuccess: (household) => {
        setCurrentHousehold(household);
      },
    }
  );

  const { execute: updateHousehold } = useApi<Household, [string, { name?: string; settings?: any }]>(
    (id: string, data: { name?: string; settings?: any }) =>
      householdApi.update(id, data),
    {
      successMessage: 'Household updated successfully',
      onSuccess: (household) => {
        if (currentHousehold?.id === household.id) {
          setCurrentHousehold(household);
        }
      },
    }
  );

  const { execute: inviteMember } = useApi<void, [string]>(
    (email: string) =>
      householdApi.inviteMember(currentHousehold?.id || '', email),
    {
      successMessage: 'Member invited successfully',
    }
  );

  const { execute: removeMember } = useApi<void, [string]>(
    (memberId: string) =>
      householdApi.removeMember(currentHousehold?.id || '', memberId),
    {
      successMessage: 'Member removed successfully',
    }
  );

  const { execute: leaveHousehold } = useApi<void, []>(
    () => householdApi.leave(currentHousehold?.id || ''),
    {
      successMessage: 'Left household successfully',
      onSuccess: () => {
        setCurrentHousehold(null);
      },
    }
  );

  const value: HouseholdContextType = {
    currentHousehold,
    setCurrentHousehold,
    households: households || [],
    isLoading,
    error,
    refreshHouseholds,
    createHousehold,
    updateHousehold,
    inviteMember,
    removeMember,
    leaveHousehold,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
} 