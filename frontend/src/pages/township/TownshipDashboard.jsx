import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';

const issueSeed = [
  {
    id: 'TS-4021',
    title: 'Water leak near 3rd Street',
    status: 'In progress',
    category: 'Utilities',
    reportedOn: 'Jan 23, 2026',
  },
  {
    id: 'TS-3989',
    title: 'Broken sidewalk tiles',
    status: 'In review',
    category: 'Infrastructure',
    reportedOn: 'Jan 19, 2026',
  },
  {
    id: 'TS-3920',
    title: 'Noise complaint at night market',
    status: 'Resolved',
    category: 'Public Safety',
    reportedOn: 'Jan 12, 2026',
  },
];

const feedbackSeed = [
  {
    id: 'TFB-03',
    issueId: 'TS-3920',
    citizen: 'Hassan R.',
    rating: 'Satisfied',
    message: 'The enforcement team responded quickly.',
    date: 'Jan 25, 2026',
  },
  {
    id: 'TFB-02',
    issueId: 'TS-3888',
    citizen: 'Zara M.',
    rating: 'Neutral',
    message: 'Issue resolved but took longer than expected.',
    date: 'Jan 22, 2026',
  },
];

const TownshipDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeOperation, setActiveOperation] = useState('browse');
  const [issues] = useState(issueSeed);
  const [chairmanForm, setChairmanForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    unionCouncil: '',
  });
  const [chairmanSuccess, setChairmanSuccess] = useState(false);

  const operations = useMemo(
    () => [
      {
        id: 'browse',
        label: 'Browse issues',
        description: 'Monitor township-level reports and updates.',
      },
      {
        id: 'register-uc',
        label: 'Register UC chairmen',
        description: 'Create accounts for union council leadership.',
      },
      {
        id: 'feedback',
        label: 'Citizen feedback',
        description: 'Review feedback on resolved issues.',
      },
    ],
    []
  );

  const handleChairmanChange = (event) => {
    const { name, value } = event.target;
    setChairmanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChairmanSubmit = (event) => {
    event.preventDefault();
    setChairmanSuccess(true);
    setChairmanForm({ fullName: '', email: '', phone: '', unionCouncil: '' });
    setTimeout(() => setChairmanSuccess(false), 3000);
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
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">Township Office</p>
            <h1 className="text-xl font-semibold mt-2">CivicLens Township Desk</h1>
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
                <p className="text-sm text-foreground/60">Welcome, Township Head</p>
                <h2 className="text-2xl font-semibold">Township operations</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  Township access
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
                    <h3 className="text-lg font-semibold">Township issues</h3>
                    <p className="text-sm text-foreground/60">
                      Track ongoing and resolved issues in your township.
                    </p>
                  </div>
                  <div className="text-xs text-foreground/60">{issues.length} active reports</div>
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

            {activeOperation === 'register-uc' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Register UC chairman</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  Provide leadership details to onboard the union council chairman.
                </p>
                <form onSubmit={handleChairmanSubmit} className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium">
                      Full name
                      <input
                        type="text"
                        name="fullName"
                        value={chairmanForm.fullName}
                        onChange={handleChairmanChange}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="UC chairman name"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Union council
                      <input
                        type="text"
                        name="unionCouncil"
                        value={chairmanForm.unionCouncil}
                        onChange={handleChairmanChange}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Union council name"
                        required
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium">
                      Official email
                      <input
                        type="email"
                        name="email"
                        value={chairmanForm.email}
                        onChange={handleChairmanChange}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="chairman@uc.gov"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Phone number
                      <input
                        type="tel"
                        name="phone"
                        value={chairmanForm.phone}
                        onChange={handleChairmanChange}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="+1 555 0144"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-foreground/60">
                      UC chairmen will receive invitations with secure credentials.
                    </p>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
                    >
                      Register UC chairman
                    </button>
                  </div>
                </form>

                {chairmanSuccess && (
                  <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-foreground">
                    UC chairman registered. Invitation dispatched.
                  </div>
                )}
              </section>
            )}

            {activeOperation === 'feedback' && (
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Citizen feedback</h3>
                    <p className="text-sm text-foreground/60">
                      Track citizen satisfaction on resolved township issues.
                    </p>
                  </div>
                  <div className="text-xs text-foreground/60">{feedbackSeed.length} new</div>
                </div>

                <div className="grid gap-4">
                  {feedbackSeed.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="rounded-2xl border border-foreground/10 bg-background px-4 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {feedback.issueId} · {feedback.rating}
                        </p>
                        <span className="text-xs text-foreground/60">{feedback.date}</span>
                      </div>
                      <p className="text-xs text-foreground/60 mt-1">Submitted by {feedback.citizen}</p>
                      <p className="text-sm mt-3 text-foreground">{feedback.message}</p>
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

export default TownshipDashboard;
