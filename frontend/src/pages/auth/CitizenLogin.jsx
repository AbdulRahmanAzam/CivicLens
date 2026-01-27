import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, InputField } from '../../components/auth';

const CitizenLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement actual login logic
    console.log('Citizen login:', formData);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/citizen/dashboard');
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your citizen account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Email Address"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-foreground/70">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
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
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-foreground/50">or</span>
        </div>
      </div>

      {/* Register Link */}
      <p className="text-center text-foreground/70">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:text-primary/80 font-semibold">
          Register here
        </Link>
      </p>

      {/* Government Login Link */}
      <div className="mt-6 pt-6 border-t border-primary/10">
        <p className="text-center text-sm text-foreground/50 mb-3">Are you a government official?</p>
        <Link 
          to="/official/login" 
          className="block w-full text-center border-2 border-primary/20 hover:border-primary/40 text-primary py-2.5 rounded-xl font-medium transition-all"
        >
          Official Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default CitizenLogin;
