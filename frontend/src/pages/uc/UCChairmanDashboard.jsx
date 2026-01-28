import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';

const issueSeed = [
  {
    id: 'UC-5102',
    title: 'Streetlight flickering near Oak Plaza',
    status: 'In review',
    category: 'Infrastructure',
    reportedOn: 'Jan 24, 2026',
  },
  {
    id: 'UC-5077',
    title: 'Blocked drainage in Sector B',
    status: 'In progress',
    category: 'Utilities',
    reportedOn: 'Jan 21, 2026',
  },
  {
    id: 'UC-5024',
    title: 'Playground equipment repair needed',
    status: 'Resolved',
    category: 'Public Safety',
    reportedOn: 'Jan 15, 2026',
  },
];

const statusOptions = ['In review', 'In progress', 'Resolved'];

const UCChairmanDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeOperation, setActiveOperation] = useState('browse');
  const [issues, setIssues] = useState(issueSeed);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

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

  const applyStatusUpdate = (issueId) => {
    const nextStatus = statusUpdates[issueId];
    if (!nextStatus) return;

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, status: nextStatus } : issue
      )
    );

    setStatusMessage(`Status updated for ${issueId}.`);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/official/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="w-72 min-h-screen border-r border-foreground/10 bg-white/80 backdrop-blur">
          <div className="px-6 py-6 border-b border-foreground/10">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">Union Council</p>
            <h1 className="text-xl font-semibold mt-2">CivicLens UC Desk</h1>
          </div>
          <nav className="px-4 py-6 space-y-2">
            {operations.map((operation) => (
              <button
                key={operation.id}
                type="button"
                onClick={() => setActiveOperation(operation.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  activeOperation === operation.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-foreground/10 hover:border-foreground/30'
                }`}
              >
                <p className="text-sm font-semibold">{operation.label}</p>
                <p
                  className={`text-xs mt-1 ${
                    activeOperation === operation.id ? 'text-white/70' : 'text-foreground/60'
                  }`}
                >
                  {operation.description}
                </p>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-8 py-8">
          <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm text-foreground/60">Welcome, UC Chairman</p>
                <h2 className="text-2xl font-semibold">Union council operations</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  UC access
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl border border-foreground/20 text-foreground text-xs font-semibold hover:border-foreground/40 transition-all"
                >
                  Logout
                </button>
              </div>
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

                <div className="grid gap-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-2xl border border-foreground/10 bg-background px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{issue.title}</p>
                        <p className="text-xs text-foreground/60">
                          {issue.id} · {issue.category} · Reported {issue.reportedOn}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full self-start md:self-auto ${
                          issue.status === 'Resolved'
                            ? 'bg-secondary/20 text-secondary'
                            : issue.status === 'In progress'
                              ? 'bg-accent/20 text-accent'
                              : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeOperation === 'status' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Change issue status</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  Update status to keep citizens informed about progress.
                </p>

                <div className="grid gap-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-2xl border border-foreground/10 bg-background px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{issue.title}</p>
                        <p className="text-xs text-foreground/60">
                          {issue.id} · Current status: {issue.status}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={statusUpdates[issue.id] || ''}
                          onChange={(event) => handleStatusChange(issue.id, event.target.value)}
                          className="rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Select status</option>
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => applyStatusUpdate(issue.id)}
                          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {statusMessage && (
                  <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-foreground">
                    {statusMessage}
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UCChairmanDashboard;
