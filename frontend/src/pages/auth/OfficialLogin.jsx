import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, InputField } from '../../components/auth';

const officialTypes = [
  {
    id: 'mayor',
    title: 'Mayor',
    description: 'City-level administrator',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'township',
    title: 'Township Head',
    description: 'Township-level administrator',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'uc_chairman',
    title: 'UC Chairman',
    description: 'Union Council administrator',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const OfficialLogin = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) return;
    
    setIsLoading(true);
    // TODO: Implement actual login logic
    console.log('Official login:', { type: selectedType, ...formData });
    setTimeout(() => {
      setIsLoading(false);
      if (selectedType === 'mayor') {
        navigate('/mayor/dashboard');
      } else if (selectedType === 'township') {
        navigate('/township/dashboard');
      } else if (selectedType === 'uc_chairman') {
        navigate('/uc/dashboard');
      }
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Official Login" 
      subtitle="Access the administrative dashboard"
    >
      {/* Official Type Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Your Role <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3">
          {officialTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedType === type.id
                  ? 'border-primary bg-primary/5'
                  : 'border-primary/10 hover:border-primary/30 bg-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${selectedType === type.id ? 'bg-primary/10 text-primary' : 'bg-background text-foreground/60'}`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${selectedType === type.id ? 'text-primary' : 'text-foreground'}`}>
                  {type.title}
                </div>
                <div className="text-sm text-foreground/60">{type.description}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedType === type.id ? 'border-primary' : 'border-foreground/20'
              }`}>
                {selectedType === type.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Employee ID"
          name="employeeId"
          placeholder="Enter your employee ID"
          value={formData.employeeId}
          onChange={handleChange}
          required
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          }
        />

        <InputField
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        <div className="flex justify-end">
          <Link to="/official/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading || !selectedType}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In as Official'
          )}
        </button>
      </form>

      {/* Citizen Login Link */}
      <div className="mt-6 pt-6 border-t border-primary/10">
        <p className="text-center text-sm text-foreground/50 mb-3">Are you a citizen?</p>
        <Link 
          to="/login" 
          className="block w-full text-center border-2 border-primary/20 hover:border-primary/40 text-primary py-2.5 rounded-xl font-medium transition-all"
        >
          Citizen Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default OfficialLogin;
