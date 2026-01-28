/**
 * Report Issue Page
 * Allows citizens to submit new complaints
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { complaintsApi, categoriesApi } from '../../services/api';
import { 
  Button, 
  Input, 
  Textarea, 
  Select, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter,
  Alert,
  Spinner 
} from '../../components/ui';

// Validation schema
const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must not exceed 1000 characters'),
  category: z.string().min(1, 'Please select a category'),
  severity: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Please select severity' }),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
});

// Location icon
const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Microphone icon
const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

// Image icon
const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ReportIssuePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [voiceNote, setVoiceNote] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      severity: 'medium',
    },
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getCategories();
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setValue('lat', latitude);
        setValue('lng', longitude);
        
        // Try to get address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            setValue('address', data.display_name);
          }
        } catch (err) {
          console.error('Failed to get address:', err);
        }
        
        setLocationLoading(false);
      },
      () => {
        setError('Failed to get your location. Please enable location services.');
        setLocationLoading(false);
      }
    );
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording logic would go here
      setIsRecording(false);
    } else {
      try {
        // Start recording
        setIsRecording(true);
        // Recording logic would be implemented here
      } catch {
        setError('Failed to access microphone');
      }
    }
  };

  // Form submission
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('severity', data.severity);
      
      if (data.lat && data.lng) {
        formData.append('lat', data.lat);
        formData.append('lng', data.lng);
      }
      if (data.address) {
        formData.append('address', data.address);
      }

      // Append images
      images.forEach((img) => {
        formData.append('images', img.file);
      });

      // Append voice note if exists
      if (voiceNote) {
        formData.append('voiceNote', voiceNote);
      }

      await complaintsApi.createComplaint(formData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/citizen/complaints');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const severityOptions = [
    { value: 'low', label: 'Low - Minor inconvenience' },
    { value: 'medium', label: 'Medium - Needs attention' },
    { value: 'high', label: 'High - Urgent issue' },
    { value: 'critical', label: 'Critical - Emergency' },
  ];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Complaint Submitted!</h2>
            <p className="text-foreground/60 mb-6">
              Your complaint has been submitted successfully. You'll receive updates on its status.
            </p>
            <Button onClick={() => navigate('/citizen/complaints')}>
              View My Complaints
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
          <CardDescription>
            Submit a complaint about civic issues in your area. Provide as much detail as possible.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Title */}
            <Input
              label="Issue Title"
              placeholder="Brief title describing the issue"
              error={errors.title?.message}
              {...register('title')}
            />

            {/* Category */}
            <Select
              label="Category"
              error={errors.category?.message}
              {...register('category')}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Select>

            {/* Severity */}
            <Select
              label="Severity Level"
              error={errors.severity?.message}
              {...register('severity')}
            >
              {severityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Provide detailed information about the issue..."
              rows={5}
              error={errors.description?.message}
              {...register('description')}
            />

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Location
              </label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  loading={locationLoading}
                  icon={<LocationIcon />}
                >
                  {location ? 'Update Location' : 'Get Current Location'}
                </Button>
              </div>
              {location && (
                <p className="mt-2 text-sm text-foreground/60">
                  📍 Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Photos (Optional)
              </label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-24 h-24 border-2 border-dashed border-foreground/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <ImageIcon />
                    <span className="text-xs text-foreground/50 mt-1">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-foreground/50 mt-2">Max 5 images, up to 5MB each</p>
            </div>

            {/* Voice Note */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Voice Note (Optional)
              </label>
              <Button
                type="button"
                variant={isRecording ? 'danger' : 'outline'}
                onClick={toggleRecording}
                icon={<MicIcon />}
              >
                {isRecording ? 'Stop Recording' : 'Record Voice Note'}
              </Button>
              {voiceNote && (
                <p className="mt-2 text-sm text-foreground/60">
                  🎤 Voice note recorded
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading || isSubmitting}
            >
              Submit Complaint
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ReportIssuePage;
