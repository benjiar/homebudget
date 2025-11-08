import { Button, LoadingCard } from '@homebudget/ui';
import { Category, formatCurrency } from '@homebudget/types';

interface CategoriesListProps {
    categories: Category[];
    isLoading: boolean;
    onEdit: (category: Category) => void;
    onDelete: (categoryId: string) => void;
}

const getCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
        'utensils': '🍽️',
        'zap': '⚡',
        'home': '🏠',
        'car': '🚗',
        'heart': '❤️',
        'baby': '👶',
        'play': '🎮',
        'shopping-bag': '🛍️',
        'more-horizontal': '⚫',
        'dollar-sign': '💰',
        'book': '📚',
        'music': '🎵'
    };
    return iconMap[iconName] || '📂';
};

export function CategoriesList({ categories, isLoading, onEdit, onDelete }: CategoriesListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <LoadingCard key={i} lines={4} showAvatar />
                ))}
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No categories found</h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                    Default categories should have been created automatically. Try refreshing the page.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-medium shadow-sm"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <span className="text-lg">
                                        {getCategoryIcon(category.icon || 'more-horizontal')}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 truncate">{category.name}</h3>
                                    {category.is_system && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            System
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {category.description && (
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{category.description}</p>
                        )}

                        {category.monthly_budget && (
                            <div className="mb-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Monthly Budget:</span>
                                    <span className="font-medium text-emerald-600">
                                        {formatCurrency(category.monthly_budget)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                            <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full ${category.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                                }`}>
                                {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex space-x-3">
                            <Button
                                onClick={() => onEdit(category)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                            >
                                Edit
                            </Button>
                            {!category.is_system && (
                                <Button
                                    onClick={() => onDelete(category.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white h-10 px-4"
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
