/**
 * Manage Territories Page
 * Admin page for managing territories (townships, UCs)
 */

import { useState, useEffect } from 'react';
import { territoriesApi } from '../../services/api';
import { 
  Button, 
  Card, 
  CardContent,
  Badge,
  Input,
  Select,
  Spinner,
  EmptyState,
  Alert
} from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

// Territory types - matches backend
const TERRITORY_TYPES = [
  { value: 'Town', label: 'Township/Town' },
  { value: 'UC', label: 'Union Council' },
];

const TerritoryCard = ({ territory, onEdit, onDelete }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="primary" size="sm">
              {territory.type}
            </Badge>
            {territory.town && (
              <Badge variant="outline" size="sm">
                {territory.town}
              </Badge>
            )}
            {territory.city && (
              <Badge variant="secondary" size="sm">
                {territory.city}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{territory.name}</h3>
          {territory.code && (
            <p className="text-sm text-foreground/60 mt-1">
              Code: {territory.code}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-foreground/50">
            {territory.population > 0 && (
              <span>Pop: {territory.population.toLocaleString()}</span>
            )}
            {territory.ucNumber && (
              <span>UC #{territory.ucNumber}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(territory)}
            className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(territory)}
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

const ManageTerritoriesPage = () => {
  const [territories, setTerritories] = useState([]);
  const [towns, setTowns] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'UC',
    townId: '',
    cityId: '',
    code: '',
    ucNumber: '',
    population: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch territories
  const fetchTerritories = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [territoriesRes, townsRes, citiesRes] = await Promise.all([
        territoriesApi.getTerritories(),
        territoriesApi.getTownList(),
        territoriesApi.getCities(),
      ]);
      
      // Combine towns and UCs into a single list with type indicator
      const allTerritories = [
        ...territoriesRes.territories.filter(t => t.type === 'Town').map(t => ({
          ...t,
          type: 'Town',
        })),
        ...territoriesRes.territories.filter(t => t.type === 'UC').map(t => ({
          ...t,
          type: 'UC',
        })),
      ];
      
      setTerritories(allTerritories);
      setTowns(townsRes.data || []);
      setCities(citiesRes.data || []);
    } catch (err) {
      console.error('Error fetching territories:', err);
      setError(err.response?.data?.message || 'Failed to load territories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritories();
  }, []);

  // Filter territories
  const filteredTerritories = territories.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Handle create
  const handleCreate = () => {
    setFormData({
      name: '',
      type: 'UC',
      townId: '',
      cityId: '',
      code: '',
      ucNumber: '',
      population: '',
    });
    setCreateModal(true);
  };

  // Handle edit
  const handleEdit = (territory) => {
    setSelectedTerritory(territory);
    setFormData({
      name: territory.name,
      type: territory.type,
      townId: territory.town_id || '',
      cityId: territory.city_id || '',
      code: territory.code || '',
      ucNumber: territory.ucNumber || territory.uc_id || '',
      population: territory.population || '',
    });
    setEditModal(true);
  };

  // Handle save (create or update)
  const handleSave = async (isCreate = false) => {
    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        name: formData.name,
        code: formData.code || undefined,
        population: formData.population ? parseInt(formData.population) : undefined,
      };

      // Add type-specific fields
      if (formData.type === 'UC') {
        payload.townId = formData.townId;
        payload.ucNumber = formData.ucNumber ? parseInt(formData.ucNumber) : undefined;
      } else if (formData.type === 'Town') {
        payload.cityId = formData.cityId;
      }

      if (isCreate) {
        await territoriesApi.createTerritory(payload);
      } else {
        await territoriesApi.updateTerritory(selectedTerritory._id, payload);
      }

      await fetchTerritories();
      setCreateModal(false);
      setEditModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save territory');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = (territory) => {
    setSelectedTerritory(territory);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      await territoriesApi.deleteTerritory(selectedTerritory._id);
      await fetchTerritories();
      setDeleteModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete territory');
    } finally {
      setSubmitting(false);
    }
  };

  // Form modal content
  const FormModalContent = ({ isCreate = false }) => (
    <div className="space-y-4">
      <Select
        label="Type"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value, townId: '', cityId: '' })}
      >
        {TERRITORY_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </Select>

      <Input
        label="Name"
        placeholder="Territory name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Code (Optional)"
        placeholder="e.g., KHI-UC001"
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
      />

      {formData.type === 'UC' && (
        <>
          <Select
            label="Parent Town"
            value={formData.townId}
            onChange={(e) => setFormData({ ...formData, townId: e.target.value })}
            required
          >
            <option value="">Select Town</option>
            {towns.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} {t.city ? `(${t.city})` : ''}
              </option>
            ))}
          </Select>
          <Input
            label="UC Number"
            type="number"
            placeholder="e.g., 1"
            value={formData.ucNumber}
            onChange={(e) => setFormData({ ...formData, ucNumber: e.target.value })}
          />
        </>
      )}

      {formData.type === 'Town' && (
        <Select
          label="Parent City"
          value={formData.cityId}
          onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
          required
        >
          <option value="">Select City</option>
          {cities.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
      )}

      <Input
        label="Population (Optional)"
        type="number"
        placeholder="e.g., 50000"
        value={formData.population}
        onChange={(e) => setFormData({ ...formData, population: e.target.value })}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => isCreate ? setCreateModal(false) : setEditModal(false)}
        >
          Cancel
        </Button>
        <Button onClick={() => handleSave(isCreate)} loading={submitting}>
          {isCreate ? 'Create Territory' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Territories</h1>
          <p className="text-foreground/60 mt-1">
            Configure cities, townships, and union councils
          </p>
        </div>
        <Button onClick={handleCreate} icon={<PlusIcon />}>
          Add Territory
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search territories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-foreground/5 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="sm:w-40"
            >
              <option value="">All Types</option>
              {TERRITORY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Territories List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredTerritories.length === 0 ? (
        <EmptyState
          title="No territories found"
          description="Create your first territory to get started"
          action={
            <Button onClick={handleCreate} icon={<PlusIcon />}>
              Add Territory
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTerritories.map((territory) => (
            <TerritoryCard
              key={territory._id}
              territory={territory}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Add New Territory"
        size="md"
      >
        <FormModalContent isCreate={true} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Territory"
        size="md"
      >
        <FormModalContent isCreate={false} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Territory"
        message={`Are you sure you want to delete "${selectedTerritory?.name}"? This may affect complaints and officials assigned to this territory.`}
        confirmText="Delete"
        variant="danger"
        loading={submitting}
      />
    </div>
  );
};

export default ManageTerritoriesPage;
