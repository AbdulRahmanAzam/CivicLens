import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { complaintsApi } from '../../services/api';

const statusOptions = [
  { value: 'acknowledged', label: 'In review' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
];

const UCChairmanDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeOperation, setActiveOperation] = useState('browse');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user?.uc) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await complaintsApi.getComplaints({
          ucId: user.uc,
          limit: 50,
          sort_by: 'createdAt',
          sort_order: 'desc',
        });
        const complaintsList = response.data?.complaints || response.data || [];
        setIssues(complaintsList);
      } catch (err) {
        console.error('Failed to load UC complaints:', err);
        setStatusMessage('Failed to load complaints. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user]);

  const operations = useMemo(
    () => [
      {
        id: 'browse',
        label: 'Browse issues',
        description: 'Review reported issues in your union council.',
      },
      {
        id: 'status',
        label: 'Change issue status',
        description: 'Update the status as work progresses.',
      },
    ],
    []
  );

  const handleStatusChange = (issueId, value) => {
    setStatusUpdates((prev) => ({ ...prev, [issueId]: value }));
  };

  const applyStatusUpdate = async (issueId) => {
    const nextStatus = statusUpdates[issueId];
    if (!nextStatus) return;

    try {
      await complaintsApi.updateStatus(issueId, nextStatus);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId || issue._id === issueId
            ? { ...issue, status: nextStatus }
            : issue
        )
      );
      setStatusMessage(`Status updated for ${issueId}.`);
    } catch (error) {
      console.error('Status update failed:', error);
      setStatusMessage(error.response?.data?.message || 'Failed to update status.');
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/official/login');
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-foreground/60">Welcome, UC Chairman</p>
          <h2 className="text-2xl font-semibold">Union council operations</h2>
        </div>
        <div className="px-4 py-2 rounded-full bg-primary/15 text-primary text-xs font-semibold">
          UC access
        </div>
      </div>

      {/* Operation tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {operations.map((operation) => (
          <button
            key={operation.id}
            type="button"
            onClick={() => setActiveOperation(operation.id)}
            className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
              activeOperation === operation.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-foreground/10 hover:border-foreground/30'
            }`}
          >
            <p className="text-sm font-semibold">{operation.label}</p>
          </button>
        ))}
      </div>

            {activeOperation === 'browse' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Union council issues</h3>
                    <p className="text-sm text-foreground/60">
                      Track issues reported within your union council.
                    </p>
                  </div>
                  <div className="text-xs text-foreground/60">{issues.length} reports</div>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-foreground/60">Loading complaints...</div>
                ) : (
                  <div className="grid gap-4">
                    {issues.map((issue) => {
                      const issueId = issue.id || issue._id;
                      return (
                        <div
                          key={issueId}
                          className="rounded-2xl border border-foreground/10 bg-background px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-semibold">{issue.description?.substring(0, 80) || 'No description'}</p>
                            <p className="text-xs text-foreground/60">
                              {issue.complaintId || issueId?.toString()?.substring(0, 8) || 'N/A'} · {issue.category?.primary || 'Uncategorized'} · Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full self-start md:self-auto ${
                              issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'citizen_feedback'
                                ? 'bg-secondary/20 text-secondary'
                                : issue.status === 'in_progress'
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-primary/15 text-primary'
                            }`}
                          >
                            {issue.status || 'submitted'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeOperation === 'status' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Change issue status</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  Update status to keep citizens informed about progress.
                </p>

                <div className="grid gap-4">
                  {issues.map((issue) => {
                    const issueId = issue.id || issue._id;
                    return (
                      <div
                        key={issueId}
                        className="rounded-2xl border border-foreground/10 bg-background px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{issue.description?.substring(0, 80) || 'No description'}</p>
                          <p className="text-xs text-foreground/60">
                            {issue.complaintId || issueId?.toString()?.substring(0, 8) || 'N/A'} · Current status: {issue.status || 'submitted'}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={statusUpdates[issueId] || ''}
                            onChange={(event) => handleStatusChange(issueId, event.target.value)}
                            className="rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <option value="">Select status</option>
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => applyStatusUpdate(issueId)}
                            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {statusMessage && (
                  <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-foreground">
                    {statusMessage}
                  </div>
                )}
              </section>
            )}
          </div>
  );
};

export default UCChairmanDashboard;
