import React, { useMemo, useState } from 'react';

const initialMayorForm = {
  fullName: '',
  email: '',
  phone: '',
  municipality: '',
  temporaryPassword: '',
};

const AdminDashboard = () => {
  const [activeOperation, setActiveOperation] = useState('generate-mayor');
  const [formData, setFormData] = useState(initialMayorForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const operations = useMemo(
    () => [
      {
        id: 'generate-mayor',
        label: 'Generate mayor account',
        description: 'Create a secure account for the city mayor.',
      },
    ],
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setResult({
        type: 'success',
        message: `Mayor account created for ${formData.fullName || 'the mayor'}.`,
        details: {
          username: formData.email || 'mayor@civic.gov',
          tempPassword: formData.temporaryPassword || 'Generated automatically',
        },
      });
      setFormData(initialMayorForm);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 min-h-screen border-r border-foreground/10 bg-white/80 backdrop-blur">
          <div className="px-6 py-6 border-b border-foreground/10">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">Admin Panel</p>
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
                    ? 'bg-foreground text-white border-foreground'
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

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm text-foreground/60">Welcome back, Admin</p>
                <h2 className="text-2xl font-semibold">Generate mayor account</h2>
              </div>
              <div className="px-4 py-2 rounded-full bg-secondary/15 text-secondary text-xs font-semibold">
                Secure operations
              </div>
            </div>

            <div className="grid gap-6">
              <section className="bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Mayor account details</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  Provide the official information to generate credentials for the mayor.
                </p>

                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium">
                      Full name
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Mayor's full name"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Official email
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="mayor@city.gov"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        required
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium">
                      Phone number
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 555 0100"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Municipality
                      <input
                        type="text"
                        name="municipality"
                        value={formData.municipality}
                        onChange={handleChange}
                        placeholder="City or county"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        required
                      />
                    </label>
                  </div>

                  <label className="text-sm font-medium">
                    Temporary password
                    <input
                      type="text"
                      name="temporaryPassword"
                      value={formData.temporaryPassword}
                      onChange={handleChange}
                      placeholder="Leave blank to auto-generate"
                      className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <p className="text-xs text-foreground/60">
                      A secure onboarding email will be sent to the mayor once the account is generated.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 disabled:bg-foreground/40 transition-all"
                    >
                      {isSubmitting ? 'Generating...' : 'Generate account'}
                    </button>
                  </div>
                </form>
              </section>

              {result && (
                <section className="bg-secondary/10 border border-secondary/30 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{result.message}</p>
                      <div className="text-xs text-foreground/60 mt-2 space-y-1">
                        <p>Username: {result.details.username}</p>
                        <p>Temporary password: {result.details.tempPassword}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
