import React from 'react';
import { useHousehold } from '../contexts/HouseholdContext';

export function HouseholdSelector() {
  const { selectedHouseholds, setSelectedHouseholds, households, isLoading } = useHousehold();

  if (isLoading) return <div>Loading households...</div>;

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Select Household(s)</label>
      <select
        multiple
        value={selectedHouseholds}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
          setSelectedHouseholds(selected);
        }}
        className="w-full border rounded-lg p-2"
      >
        {households.map((household) => (
          <option key={household.id} value={household.id}>
            {household.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
    </div>
  );
}
