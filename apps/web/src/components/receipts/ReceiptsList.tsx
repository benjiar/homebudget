import { Button, LoadingCard } from '@homebudget/ui';
import { Receipt, formatCurrency } from '@homebudget/types';

interface ReceiptsListProps {
    receipts: Receipt[];
    isLoading: boolean;
    onEdit: (receipt: Receipt) => void;
    onDelete: (receiptId: string) => void;
}

export function ReceiptsList({ receipts, isLoading, onEdit, onDelete }: ReceiptsListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <LoadingCard key={i} lines={5} showAvatar />
                ))}
            </div>
        );
    }

    if (receipts.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No receipts found</h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                    Start by adding your first receipt to track expenses.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receipts.map((receipt) => (
                <div key={receipt.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-slate-900 truncate">{receipt.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {new Date(receipt.receipt_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="ml-4">
                                <span className="text-2xl font-bold text-emerald-600">
                                    {formatCurrency(receipt.amount)}
                                </span>
                            </div>
                        </div>

                        {receipt.category && (
                            <div className="mb-4">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: receipt.category.color }}
                                    >
                                        <span className="text-sm text-white">
                                            {receipt.category.icon || '📂'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {receipt.category.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {receipt.notes && (
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{receipt.notes}</p>
                        )}

                        {receipt.photo_url && (
                            <div className="mb-4 rounded-lg overflow-hidden">
                                <img
                                    src={receipt.photo_url}
                                    alt={receipt.title}
                                    className="w-full h-32 object-cover"
                                />
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <Button
                                onClick={() => onEdit(receipt)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                            >
                                Edit
                            </Button>
                            <Button
                                onClick={() => onDelete(receipt.id)}
                                className="bg-red-600 hover:bg-red-700 text-white h-10 px-4"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
