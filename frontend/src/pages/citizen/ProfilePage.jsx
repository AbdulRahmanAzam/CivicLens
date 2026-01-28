/**
 * Profile Page
 * User profile management for citizens
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts';
import { authApi } from '../../services/api';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter,
  Alert,
  Avatar,
  Divider
} from '../../components/ui';

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  cnic: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Camera icon
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      cnic: user?.cnic || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        cnic: user.cnic || '',
      });
    }
  }, [user, resetProfile]);

  // Handle profile update
  const onProfileSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authApi.updateProfile(data);
      if (updateUser) {
        updateUser(response.data.data);
      }
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      resetPassword();
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await authApi.updateAvatar(formData);
      if (updateUser) {
        updateUser(response.data.data);
      }
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update avatar');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar
                src={user?.avatar}
                name={user?.name}
                size="xl"
              />
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <CameraIcon />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-foreground/60">{user?.email}</p>
              <p className="text-sm text-foreground/50 capitalize mt-1">
                {user?.role?.replace('_', ' ')} Account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" onDismiss={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                error={profileErrors.name?.message}
                {...registerProfile('name')}
              />
              <Input
                label="Email Address"
                type="email"
                error={profileErrors.email?.message}
                {...registerProfile('email')}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                placeholder="+92 3XX XXXXXXX"
                error={profileErrors.phone?.message}
                {...registerProfile('phone')}
              />
              <Input
                label="CNIC"
                placeholder="XXXXX-XXXXXXX-X"
                error={profileErrors.cnic?.message}
                {...registerProfile('cnic')}
              />
            </div>

            <Input
              label="Address"
              placeholder="Your residential address"
              error={profileErrors.address?.message}
              {...registerProfile('address')}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Ensure your account is using a strong password</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <CardContent className="space-y-4">
            {passwordError && (
              <Alert variant="error" onDismiss={() => setPasswordError(null)}>
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && (
              <Alert variant="success" onDismiss={() => setPasswordSuccess(null)}>
                {passwordSuccess}
              </Alert>
            )}

            <Input
              label="Current Password"
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" loading={passwordLoading}>
              Change Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-foreground/60">Account Type</span>
              <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
            <Divider />
            <div className="flex justify-between py-2">
              <span className="text-foreground/60">Member Since</span>
              <span className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </span>
            </div>
            <Divider />
            <div className="flex justify-between py-2">
              <span className="text-foreground/60">Account Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
