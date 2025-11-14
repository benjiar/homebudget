import { useState } from 'react';

export type DateRangePreset = 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';

export interface DateRange {
    startDate: string;
    endDate: string;
    preset: DateRangePreset;
}

interface DateRangeSelectorProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

const getPresetDates = (preset: DateRangePreset): { startDate: string; endDate: string } => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate: Date;

    switch (preset) {
        case 'last_month':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'last_3_months':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'last_6_months':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 6);
            break;
        case 'last_year':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        default:
            return { startDate: '', endDate: '' };
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate,
    };
};

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
    const [showCustom, setShowCustom] = useState(value.preset === 'custom');

    const handlePresetChange = (preset: DateRangePreset) => {
        if (preset === 'custom') {
            setShowCustom(true);
            onChange({ ...value, preset });
        } else {
            setShowCustom(false);
            const dates = getPresetDates(preset);
            onChange({ ...dates, preset });
        }
    };

    const handleCustomDateChange = (field: 'startDate' | 'endDate', newValue: string) => {
        onChange({
            ...value,
            [field]: newValue,
            preset: 'custom',
        });
    };

    const presets = [
        { value: 'last_month' as const, label: 'Last Month' },
        { value: 'last_3_months' as const, label: 'Last 3 Months' },
        { value: 'last_6_months' as const, label: 'Last 6 Months' },
        { value: 'last_year' as const, label: 'Last Year' },
        { value: 'custom' as const, label: 'Custom Range' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handlePresetChange(preset.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value.preset === preset.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Custom Date Inputs */}
                {showCustom && (
                    <div className="flex flex-col sm:flex-row gap-3 items-center sm:ml-4 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">From:</label>
                            <input
                                type="date"
                                value={value.startDate}
                                onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">To:</label>
                            <input
                                type="date"
                                value={value.endDate}
                                onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
