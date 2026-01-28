/**
 * Manage Categories Page
 * Admin page for managing complaint categories
 */

import { useState, useEffect } from 'react';
import { categoriesApi } from '../../services/api';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Input,
  Spinner,
  EmptyState,
  Alert,
  Textarea
} from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Category icons (can be extended)
const CATEGORY_ICONS = [
  { value: 'road', label: 'Road', icon: '🛣️' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'sanitation', label: 'Sanitation', icon: '🧹' },
  { value: 'streetlight', label: 'Street Light', icon: '💡' },
  { value: 'drainage', label: 'Drainage', icon: '🌊' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'park', label: 'Park', icon: '🌳' },
  { value: 'traffic', label: 'Traffic', icon: '🚦' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const CategoryCard = ({ category, onEdit, onDelete, onToggle }) => (
  <Card className={`hover:shadow-md transition-shadow ${!category.isActive ? 'opacity-60' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
          {category.icon || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            {!category.isActive && (
              <Badge variant="warning" size="sm">Inactive</Badge>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-foreground/60 mt-1 line-clamp-2">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-foreground/50">
            <span>{category.complaintsCount || 0} complaints</span>
            {category.priority && (
              <Badge variant="outline" size="sm">
                Priority: {category.priority}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggle(category)}
            className={`p-2 rounded-lg transition-colors ${
              category.isActive 
                ? 'text-foreground/50 hover:text-yellow-600 hover:bg-yellow-50'
                : 'text-foreground/50 hover:text-green-600 hover:bg-green-50'
            }`}
            title={category.isActive ? 'Deactivate' : 'Activate'}
          >
            {category.isActive ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-foreground/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ManageCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📋',
    priority: 5,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getCategories();
      setCategories(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle create
  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📋',
      priority: 5,
      isActive: true,
    });
    setCreateModal(true);
  };

  // Handle edit
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📋',
      priority: category.priority || 5,
      isActive: category.isActive !== false,
    });
    setEditModal(true);
  };

  // Handle save
  const handleSave = async (isCreate = false) => {
    setSubmitting(true);
    try {
      if (isCreate) {
        await categoriesApi.createCategory(formData);
      } else {
        await categoriesApi.updateCategory(selectedCategory._id, formData);
      }
      await fetchCategories();
      setCreateModal(false);
      setEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle active
  const handleToggle = async (category) => {
    try {
      await categoriesApi.updateCategory(category._id, {
        isActive: !category.isActive,
      });
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category');
    }
  };

  // Handle delete
  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      await categoriesApi.deleteCategory(selectedCategory._id);
      await fetchCategories();
      setDeleteModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const activeCount = categories.filter(c => c.isActive !== false).length;
  const totalComplaints = categories.reduce((sum, c) => sum + (c.complaintsCount || 0), 0);

  // Form modal content
  const FormModalContent = ({ isCreate = false }) => (
    <div className="space-y-4">
      <Input
        label="Name"
        placeholder="Category name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ICONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFormData({ ...formData, icon: item.icon })}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                formData.icon === item.icon
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : 'bg-foreground/5 hover:bg-foreground/10'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Description"
        placeholder="Brief description of this category"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
      />

      <Input
        label="Priority"
        type="number"
        min={1}
        max={10}
        placeholder="1-10 (higher = more priority)"
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-primary rounded focus:ring-primary"
        />
        <span className="text-sm text-foreground/70">Active (visible to users)</span>
      </label>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => isCreate ? setCreateModal(false) : setEditModal(false)}
        >
          Cancel
        </Button>
        <Button onClick={() => handleSave(isCreate)} loading={submitting}>
          {isCreate ? 'Create Category' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Categories</h1>
          <p className="text-foreground/60 mt-1">
            Configure complaint categories for citizens
          </p>
        </div>
        <Button onClick={handleCreate} icon={<PlusIcon />}>
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            <p className="text-xs text-foreground/50">Total Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-foreground/50">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalComplaints}</p>
            <p className="text-xs text-foreground/50">Total Complaints</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create your first category to get started"
          action={
            <Button onClick={handleCreate} icon={<PlusIcon />}>
              Add Category
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category._id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Add New Category"
        size="md"
      >
        <FormModalContent isCreate={true} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Category"
        size="md"
      >
        <FormModalContent isCreate={false} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? Existing complaints in this category will remain but may need reassignment.`}
        confirmText="Delete"
        variant="danger"
        loading={submitting}
      />
    </div>
  );
};

export default ManageCategoriesPage;
