import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

// Icons
const Icons = {
  Browse: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  UserPlus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Feedback: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Map: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Star: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
};

const issueSeed = [
  { id: 'TS-4021', title: 'Water leak near 3rd Street', status: 'In progress', category: 'Utilities', reportedOn: 'Jan 23, 2026', priority: 'high', uc: 'UC-12' },
  { id: 'TS-3989', title: 'Broken sidewalk tiles', status: 'In review', category: 'Infrastructure', reportedOn: 'Jan 19, 2026', priority: 'medium', uc: 'UC-08' },
  { id: 'TS-3920', title: 'Noise complaint at night market', status: 'Resolved', category: 'Public Safety', reportedOn: 'Jan 12, 2026', priority: 'low', uc: 'UC-05' },
];

const feedbackSeed = [
  { id: 'TFB-03', issueId: 'TS-3920', citizen: 'Hassan R.', rating: 'Satisfied', message: 'The enforcement team responded quickly.', date: 'Jan 25, 2026' },
  { id: 'TFB-02', issueId: 'TS-3888', citizen: 'Zara M.', rating: 'Neutral', message: 'Issue resolved but took longer than expected.', date: 'Jan 22, 2026' },
];

const quickStats = [
  { label: 'Active Issues', value: '24', change: '+5 this week', color: 'primary' },
  { label: 'Resolved', value: '156', change: '12 this month', color: 'secondary' },
  { label: 'UC Chairmen', value: '8', change: 'All active', color: 'blue' },
  { label: 'Avg. Resolution', value: '3.2d', change: '-0.5 days', color: 'amber' },
];

const TownshipDashboard = () => {
  const [activeOperation, setActiveOperation] = useState('browse');
  const [issues] = useState(issueSeed);
  const [chairmanForm, setChairmanForm] = useState({ fullName: '', email: '', phone: '', unionCouncil: '' });
  const [chairmanSuccess, setChairmanSuccess] = useState(false);

  const operations = useMemo(() => [
    { id: 'browse', label: 'Browse Issues', description: 'Monitor township reports', icon: Icons.Browse },
    { id: 'register-uc', label: 'Register UC Chairman', description: 'Onboard new leadership', icon: Icons.UserPlus },
    { id: 'feedback', label: 'Citizen Feedback', description: 'Review satisfaction', icon: Icons.Feedback },
  ], []);

  const handleChairmanChange = (e) => setChairmanForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleChairmanSubmit = (e) => {
    e.preventDefault();
    setChairmanSuccess(true);
    setChairmanForm({ fullName: '', email: '', phone: '', unionCouncil: '' });
    setTimeout(() => setChairmanSuccess(false), 3000);
  };

  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in review': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityDot = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-gray-400';
    }
  };

  const getRatingStyles = (rating) => {
    switch (rating.toLowerCase()) {
      case 'satisfied': return { bg: 'bg-emerald-50', text: 'text-emerald-700', emoji: '😊' };
      case 'neutral': return { bg: 'bg-amber-50', text: 'text-amber-700', emoji: '😐' };
      default: return { bg: 'bg-red-50', text: 'text-red-700', emoji: '😞' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">Township Head</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Township Operations</h1>
            <p className="text-foreground/60 mt-1">Manage issues, register leadership, and monitor citizen satisfaction</p>
          </div>
          <Link to="/map" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
            <Icons.Map />Township Map
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-foreground/10 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${stat.color === 'primary' ? 'bg-primary/10 text-primary' : stat.color === 'secondary' ? 'bg-secondary/10 text-secondary' : stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                {stat.color === 'primary' ? <Icons.Browse /> : stat.color === 'secondary' ? <Icons.Check /> : stat.color === 'blue' ? <Icons.Users /> : <Icons.Clock />}
              </div>
              <Icons.TrendingUp />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm font-medium text-foreground/70">{stat.label}</p>
            <p className="text-xs text-foreground/50 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Operation Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {operations.map((op) => (
          <button key={op.id} onClick={() => setActiveOperation(op.id)} className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 min-w-fit ${activeOperation === op.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25' : 'bg-white border-foreground/10 hover:border-primary/30 hover:bg-primary/5'}`}>
            <div className={`p-1.5 rounded-lg ${activeOperation === op.id ? 'bg-white/20' : 'bg-primary/10'}`}><op.icon /></div>
            <div className="text-left">
              <p className="text-sm font-semibold">{op.label}</p>
              <p className={`text-xs ${activeOperation === op.id ? 'text-white/70' : 'text-foreground/50'}`}>{op.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Browse Issues */}
      {activeOperation === 'browse' && (
        <section className="bg-white rounded-2xl border border-foreground/10 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-5 border-b border-foreground/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Icons.Browse /></div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Township Issues</h3>
                  <p className="text-sm text-foreground/60">Track and manage issues across all union councils</p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-foreground/5 text-sm font-medium text-foreground/70">{issues.length} active</div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {issues.map((issue) => (
              <div key={issue.id} className="rounded-xl border border-foreground/10 bg-gradient-to-r from-background to-white p-4 hover:shadow-md transition-all duration-200 group">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${getPriorityDot(issue.priority)}`}></span>
                      <span className="text-xs font-mono text-foreground/50">{issue.id}</span>
                      <span className="text-xs text-foreground/40">•</span>
                      <span className="text-xs text-foreground/50">{issue.category}</span>
                      <span className="text-xs text-foreground/40">•</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-foreground/5 text-foreground/60">{issue.uc}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{issue.title}</p>
                    <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1"><Icons.Clock />Reported {issue.reportedOn}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getStatusStyles(issue.status)}`}>{issue.status}</span>
                    <button className="p-2 rounded-lg hover:bg-foreground/5 text-foreground/40 hover:text-primary transition-colors"><Icons.ArrowRight /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Register UC Chairman */}
      {activeOperation === 'register-uc' && (
        <section className="bg-white rounded-2xl border border-foreground/10 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-primary/5 px-6 py-5 border-b border-foreground/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600"><Icons.UserPlus /></div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Register UC Chairman</h3>
                <p className="text-sm text-foreground/60">Onboard new union council leadership</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleChairmanSubmit} className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Full Name</label>
                <input type="text" name="fullName" value={chairmanForm.fullName} onChange={handleChairmanChange} placeholder="UC chairman name" className="w-full rounded-xl border-2 border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Union Council</label>
                <input type="text" name="unionCouncil" value={chairmanForm.unionCouncil} onChange={handleChairmanChange} placeholder="UC name or number" className="w-full rounded-xl border-2 border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Official Email</label>
                <input type="email" name="email" value={chairmanForm.email} onChange={handleChairmanChange} placeholder="chairman@uc.gov" className="w-full rounded-xl border-2 border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Phone Number</label>
                <input type="tel" name="phone" value={chairmanForm.phone} onChange={handleChairmanChange} placeholder="+92 3XX XXXXXXX" className="w-full rounded-xl border-2 border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <p className="text-xs text-foreground/50">Chairmen will receive invitations with secure credentials</p>
              <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2">Register Chairman<Icons.ArrowRight /></button>
            </div>
          </form>
          {chairmanSuccess && (
            <div className="mx-6 mb-6 rounded-xl border-2 border-secondary/30 bg-secondary/10 px-4 py-3 flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-secondary/20 text-secondary"><Icons.Check /></div>
              <div><p className="text-sm font-semibold text-foreground">UC chairman registered!</p><p className="text-xs text-foreground/60">Invitation dispatched</p></div>
            </div>
          )}
        </section>
      )}

      {/* Citizen Feedback */}
      {activeOperation === 'feedback' && (
        <section className="bg-white rounded-2xl border border-foreground/10 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-secondary/5 to-primary/5 px-6 py-5 border-b border-foreground/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary"><Icons.Feedback /></div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Citizen Feedback</h3>
                  <p className="text-sm text-foreground/60">Monitor satisfaction on resolved issues</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                <Icons.Star />{feedbackSeed.length} new
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {feedbackSeed.map((fb) => {
              const ratingStyle = getRatingStyles(fb.rating);
              return (
                <div key={fb.id} className="rounded-xl border border-foreground/10 bg-gradient-to-r from-background to-white p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">{fb.citizen.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{fb.citizen}</p>
                        <p className="text-xs text-foreground/50">Issue {fb.issueId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg`}>{ratingStyle.emoji}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ratingStyle.bg} ${ratingStyle.text}`}>{fb.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 bg-foreground/[0.02] rounded-lg p-3 border border-foreground/5">"{fb.message}"</p>
                  <p className="text-xs text-foreground/40 mt-2 flex items-center gap-1"><Icons.Clock />{fb.date}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default TownshipDashboard;
