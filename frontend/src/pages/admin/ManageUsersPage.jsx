/**
 * Manage Users Page
 * Admin page for managing citizen users
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Input,
  Select,
  Spinner,
  EmptyState,
  Alert,
  Avatar
} from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
// import { authApi } from '../../services/api';

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Mock users data - will be replaced with API call
const mockUsers = [
  { _id: '1', name: 'Ali Ahmad', email: 'ali@example.com', phone: '+92 300 1234567', status: 'active', role: 'citizen', complaintsCount: 5, createdAt: new Date().toISOString() },
  { _id: '2', name: 'Sara Khan', email: 'sara@example.com', phone: '+92 301 2345678', status: 'active', role: 'citizen', complaintsCount: 3, createdAt: new Date().toISOString() },
  { _id: '3', name: 'Hassan Ali', email: 'hassan@example.com', phone: '+92 302 3456789', status: 'suspended', role: 'citizen', complaintsCount: 0, createdAt: new Date().toISOString() },
];

const UserRow = ({ user, onEdit, onToggleStatus, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="sm" />
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-foreground/50">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground/70">
        {user.phone || 'N/A'}
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.status === 'active' ? 'success' : 'danger'} size="sm">
          {user.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-foreground/70">
        {user.complaintsCount || 0}
      </td>
      <td className="px-4 py-3 text-sm text-foreground/50">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            <MoreIcon />
          </button>
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-foreground/10 py-1 z-20">
                <button
                  onClick={() => { onEdit(user); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-foreground/5"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onToggleStatus(user); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-foreground/5"
                >
                  {user.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={() => { onDelete(user); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modals
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // In production, this would be an API call
      // const response = await authApi.getUsers({ page, limit, search, status });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = mockUsers;
      if (searchQuery) {
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (statusFilter) {
        filtered = filtered.filter(u => u.status === statusFilter);
      }
      
      setUsers(filtered);
      setPagination(prev => ({ ...prev, total: filtered.length, totalPages: 1 }));
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle edit
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      status: user.status,
    });
    setEditModal(true);
  };

  // Handle save
  const handleSave = async () => {
    setSubmitting(true);
    try {
      // API call: await authApi.updateUser(selectedUser._id, formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(users.map(u => 
        u._id === selectedUser._id ? { ...u, ...formData } : u
      ));
      setEditModal(false);
    } catch {
      setError('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      // API call: await authApi.updateUserStatus(user._id, newStatus);
      setUsers(users.map(u => 
        u._id === user._id ? { ...u, status: newStatus } : u
      ));
    } catch {
      setError('Failed to update user status');
    }
  };

  // Handle delete
  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      // API call: await authApi.deleteUser(selectedUser._id);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(users.filter(u => u._id !== selectedUser._id));
      setDeleteModal(false);
    } catch {
      setError('Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <p className="text-foreground/60 mt-1">View and manage citizen accounts</p>
        </div>
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
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-foreground/5 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-40"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="No users found"
                description="Try adjusting your search or filters"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Complaints
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onEdit={handleEdit}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-foreground/60">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit User"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={submitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={submitting}
      />
    </div>
  );
};

export default ManageUsersPage;
