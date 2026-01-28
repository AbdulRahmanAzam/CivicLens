import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';

const issueSeed = [
  {
    id: 'CL-1042',
    title: 'Street light outage on Maple Ave',
    status: 'In review',
    category: 'Infrastructure',
    reportedOn: 'Jan 20, 2026',
  },
  {
    id: 'CL-1031',
    title: 'Overflowing trash bins in Central Park',
    status: 'Resolved',
    category: 'Sanitation',
    reportedOn: 'Jan 18, 2026',
  },
  {
    id: 'CL-1016',
    title: 'Pothole near 5th & Pine',
    status: 'In progress',
    category: 'Road Safety',
    reportedOn: 'Jan 14, 2026',
  },
];

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeOperation, setActiveOperation] = useState('report');
  const [issues, setIssues] = useState(issueSeed);
  const [reportForm, setReportForm] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    issueId: '',
    satisfaction: 'satisfied',
    comments: '',
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const operations = useMemo(
    () => [
      {
        id: 'report',
        label: 'Report an issue',
        description: 'Send a new report to the civic team.',
      },
      {
        id: 'feedback',
        label: 'Give resolution feedback',
        description: 'Share feedback for resolved issues.',
      },
      {
        id: 'browse',
        label: 'Browse reported issues',
        description: 'Track reported issues across your city.',
      },
    ],
    []
  );

  const handleReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeedbackChange = (event) => {
    const { name, value } = event.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitReport = (event) => {
    event.preventDefault();
    const newIssue = {
      id: `CL-${1000 + issues.length + 1}`,
      title: reportForm.title || 'New civic issue',
      status: 'Submitted',
      category: reportForm.category || 'General',
      reportedOn: 'Just now',
    };

    setIssues((prev) => [newIssue, ...prev]);
    setReportForm({ title: '', category: '', location: '', description: '' });
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 3000);
  };

  const handleSubmitFeedback = (event) => {
    event.preventDefault();
    setFeedbackSuccess(true);
    setFeedbackForm({ issueId: '', satisfaction: 'satisfied', comments: '' });
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  const resolvedIssues = issues.filter((issue) => issue.status.toLowerCase() === 'resolved');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="w-72 min-h-screen border-r border-foreground/10 bg-white/80 backdrop-blur">
          <div className="px-6 py-6 border-b border-foreground/10">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">Citizen Portal</p>
            <h1 className="text-xl font-semibold mt-2">CivicLens Dashboard</h1>
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
                <p className="text-sm text-foreground/60">Hello citizen</p>
                <h2 className="text-2xl font-semibold">Your civic workspace</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  Community services
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

            {activeOperation === 'report' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Report an issue</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  Provide details about the issue and we will route it to the right department.
                </p>
                <form onSubmit={handleSubmitReport} className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium">
                      Issue title
                      <input
                        type="text"
                        name="title"
                        value={reportForm.title}
                        onChange={handleReportChange}
                        placeholder="Broken traffic light"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Category
                      <select
                        name="category"
                        value={reportForm.category}
                        onChange={handleReportChange}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        required
                      >
                        <option value="">Select category</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Public Safety">Public Safety</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Road Safety">Road Safety</option>
                        <option value="Utilities">Utilities</option>
                      </select>
                    </label>
                  </div>

                  <label className="text-sm font-medium">
                    Location
                    <input
                      type="text"
                      name="location"
                      value={reportForm.location}
                      onChange={handleReportChange}
                      placeholder="Street address or landmark"
                      className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Description
                    <textarea
                      name="description"
                      value={reportForm.description}
                      onChange={handleReportChange}
                      placeholder="Describe the issue in detail"
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-foreground/60">
                      Reports are reviewed within 24 hours. Emergency issues should be reported by phone.
                    </p>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
                    >
                      Submit report
                    </button>
                  </div>
                </form>

                {reportSuccess && (
                  <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-foreground">
                    Issue submitted successfully. Tracking ID created.
                  </div>
                )}
              </section>
            )}

            {activeOperation === 'feedback' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Resolution feedback</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  Let us know if the resolution met your expectations.
                </p>
                <form onSubmit={handleSubmitFeedback} className="grid gap-4">
                  <label className="text-sm font-medium">
                    Resolved issue
                    <select
                      name="issueId"
                      value={feedbackForm.issueId}
                      onChange={handleFeedbackChange}
                      className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    >
                      <option value="">Select a resolved issue</option>
                      {resolvedIssues.map((issue) => (
                        <option key={issue.id} value={issue.id}>
                          {issue.id} · {issue.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium">
                    Satisfaction level
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['satisfied', 'neutral', 'unsatisfied'].map((level) => (
                        <label
                          key={level}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                            feedbackForm.satisfaction === level
                              ? 'border-primary bg-primary/10'
                              : 'border-foreground/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name="satisfaction"
                            value={level}
                            checked={feedbackForm.satisfaction === level}
                            onChange={handleFeedbackChange}
                            className="text-primary focus:ring-primary/30"
                          />
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </label>
                      ))}
                    </div>
                  </label>

                  <label className="text-sm font-medium">
                    Additional comments
                    <textarea
                      name="comments"
                      value={feedbackForm.comments}
                      onChange={handleFeedbackChange}
                      rows={3}
                      placeholder="Share your experience"
                      className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-foreground/60">
                      Your feedback helps improve response times and service quality.
                    </p>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
                    >
                      Send feedback
                    </button>
                  </div>
                </form>

                {feedbackSuccess && (
                  <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-foreground">
                    Thanks for your feedback. It has been recorded.
                  </div>
                )}
              </section>
            )}

            {activeOperation === 'browse' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Reported issues</h3>
                    <p className="text-sm text-foreground/60">
                      Browse issues reported by citizens in your municipality.
                    </p>
                  </div>
                  <div className="text-xs text-foreground/60">{issues.length} total</div>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenDashboard;
