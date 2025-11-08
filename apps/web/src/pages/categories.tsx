import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { Button, LoadingPage, Modal } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { CategoryForm } from '../components/CategoryForm';
import { CategoriesList } from '../components/categories/CategoriesList';
import { MessageAlert } from '../components/common/MessageAlert';
import { useCategories } from '../hooks/useCategories';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@homebudget/types';

export default function CategoriesPage() {
  const { user, loading } = useAuth();
  const { selectedHouseholds } = useHousehold();
  const {
    categories,
    isLoading,
    isSubmitting,
    message,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (data: CreateCategoryRequest | UpdateCategoryRequest): Promise<Category> => {
    if (editingCategory) {
      const updated = await updateCategory(editingCategory.id, data as UpdateCategoryRequest);
      setEditingCategory(null);
      setShowAddForm(false);
      return updated;
    } else {
      const newCategory = await createCategory(data as CreateCategoryRequest);
      setShowAddForm(false);
      return newCategory;
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setShowAddForm(false);
  };

  // Get the first selected household for creating new categories
  const primaryHouseholdId = selectedHouseholds.length > 0 ? selectedHouseholds[0] : '';

  if (loading) {
    return <LoadingPage title="Loading Categories" subtitle="Please wait..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Categories">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Categories</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Organize your expenses and set budgets for better tracking
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
              >
                Add Category
              </Button>
            </div>

            <MessageAlert message={message} />

            <CategoriesList
              categories={categories}
              isLoading={isLoading}
              onEdit={startEditCategory}
              onDelete={deleteCategory}
            />

            {/* Add/Edit Category Modal */}
            {showAddForm && primaryHouseholdId && (
              <Modal
                isOpen={showAddForm}
                onClose={resetForm}
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
                size="md"
              >
                <CategoryForm
                  householdId={primaryHouseholdId}
                  onSubmit={handleSubmit}
                  onCancel={resetForm}
                  isLoading={isSubmitting}
                  initialData={editingCategory || undefined}
                  isEditMode={!!editingCategory}
                />
              </Modal>
            )}
          </div>
        </div>
      </Layout>
    </RequireHousehold>
  );
} 