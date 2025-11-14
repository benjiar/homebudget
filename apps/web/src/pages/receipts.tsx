import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { Button, LoadingPage, Modal } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { ReceiptForm } from '../components/ReceiptForm';
import { ReceiptsList } from '../components/receipts/ReceiptsList';
import { MessageAlert } from '../components/common/MessageAlert';
import { useReceipts } from '../hooks/useReceipts';
import { useCategories } from '../hooks/useCategories';
import { Receipt, CreateReceiptRequest, CreateCategoryRequest, Category } from '@homebudget/types';

export default function ReceiptsPage() {
  const { user, loading } = useAuth();
  const { selectedHouseholdIds, isLoading: isLoadingHouseholds, households } = useHousehold();
  const {
    receipts,
    isLoading,
    isSubmitting,
    message: receiptsMessage,
    currentPage,
    totalPages,
    loadReceipts,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    setCurrentPage,
  } = useReceipts();

  const {
    categories,
    isLoading: isLoadingCategories,
    loadCategories,
    createCategory,
  } = useCategories();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const previousPageRef = useRef<number | null>(null);

  useEffect(() => {
    // Wait for auth and households to finish loading before fetching data
    // Reload when page changes or household selection changes
    if (!loading && !isLoadingHouseholds && households.length > 0) {
      if (previousPageRef.current !== currentPage) {
        previousPageRef.current = currentPage;
        loadReceipts();
        loadCategories();
      } else {
        // Reload when household selection changes (but page hasn't changed)
        loadReceipts();
        loadCategories();
      }
    }
  }, [currentPage, loading, isLoadingHouseholds, households.length, selectedHouseholdIds.join(',')]);

  const handleSubmit = async (data: CreateReceiptRequest, photo?: File): Promise<void> => {
    if (editingReceipt) {
      await updateReceipt(editingReceipt.id, data, photo);
      setEditingReceipt(null);
    } else {
      await createReceipt(data, photo);
    }
    setShowAddForm(false);
  };

  const handleCreateCategory = async (data: CreateCategoryRequest): Promise<Category> => {
    const newCategory = await createCategory(data);
    await loadCategories();
    return newCategory;
  };

  const startEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingReceipt(null);
    setShowAddForm(false);
  };

  const primaryHouseholdId = selectedHouseholdIds.length > 0 ? selectedHouseholdIds[0] : '';

  if (loading) {
    return <LoadingPage title="Loading Receipts" subtitle="Please wait..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Receipts">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Receipts</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Track and manage your expenses
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
              >
                Add Receipt
              </Button>
            </div>

            <MessageAlert message={receiptsMessage} />

            <ReceiptsList
              receipts={receipts}
              isLoading={isLoading}
              onEdit={startEditReceipt}
              onDelete={deleteReceipt}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Add/Edit Receipt Modal */}
            <Modal
              isOpen={showAddForm}
              onClose={resetForm}
              title={editingReceipt ? 'Edit Receipt' : 'Add New Receipt'}
              size="lg"
            >
              <ReceiptForm
                households={households}
                categories={categories}
                isLoadingCategories={isLoadingCategories}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                isLoading={isSubmitting}
                initialHouseholdId={primaryHouseholdId}
                onCreateCategory={handleCreateCategory}
              />
            </Modal>
          </div>
        </div>
      </Layout>
    </RequireHousehold>
  );
}
