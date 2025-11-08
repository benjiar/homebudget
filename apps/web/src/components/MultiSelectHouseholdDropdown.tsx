import React, { useState, useRef, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';

export function MultiSelectHouseholdDropdown() {
    const { selectedHouseholdIds, setSelectedHouseholdIds, households, isLoading, isAllSelected } = useHousehold();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const toggleHousehold = (householdId: string) => {
        if (selectedHouseholdIds.includes(householdId)) {
            // Remove from selection
            const newSelection = selectedHouseholdIds.filter(id => id !== householdId);
            setSelectedHouseholdIds(newSelection);
        } else {
            // Add to selection
            setSelectedHouseholdIds([...selectedHouseholdIds, householdId]);
        }
    };

    const toggleAll = () => {
        if (isAllSelected) {
            // Select first household instead of all
            if (households.length > 0) {
                setSelectedHouseholdIds([households[0].id]);
            }
        } else {
            // Select all (empty array)
            setSelectedHouseholdIds([]);
        }
    };

    const getDisplayText = () => {
        if (isLoading) return 'Loading...';
        if (households.length === 0) return 'No households';
        if (isAllSelected) return 'All Households';
        if (selectedHouseholdIds.length === 1) {
            const household = households.find(h => h.id === selectedHouseholdIds[0]);
            return household?.name || 'Unknown';
        }
        return `${selectedHouseholdIds.length} Households`;
    };

    if (isLoading) {
        return (
            <div className="relative">
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">
                    Loading households...
                </div>
            </div>
        );
    }

    if (households.length === 0) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-w-[200px]"
            >
                <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
                <span className="flex-1 text-left text-sm font-medium text-gray-700">
                    {getDisplayText()}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {/* Select All Option */}
                    <div
                        onClick={toggleAll}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    >
                        <div className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${isAllSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 bg-white'
                            }`}>
                            {isAllSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">All Households</div>
                            <div className="text-xs text-gray-500">View data from all your households</div>
                        </div>
                    </div>

                    {/* Individual Household Options */}
                    {households.map((household) => {
                        const isSelected = selectedHouseholdIds.includes(household.id);
                        return (
                            <div
                                key={household.id}
                                onClick={() => toggleHousehold(household.id)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                            >
                                <div className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${isSelected
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300 bg-white'
                                    }`}>
                                    {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{household.name}</div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer with selection count */}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                            {isAllSelected
                                ? `Showing all ${households.length} households`
                                : `${selectedHouseholdIds.length} of ${households.length} selected`
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
