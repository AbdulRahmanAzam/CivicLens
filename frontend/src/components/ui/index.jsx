/**
 * UI Components
 * Reusable UI components for the application
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

// ============================================
// BUTTON
// ============================================

const buttonVariants = {
  primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/30',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/30',
  outline: 'border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary/30',
  ghost: 'text-foreground hover:bg-foreground/10 focus:ring-foreground/30',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-300',
};

const buttonSizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-lg',
};

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none focus:ring-2',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="mr-2" />
      ) : leftIcon ? (
        <span className="w-5 h-5">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span className="w-5 h-5">{rightIcon}</span>}
    </button>
  );
});
Button.displayName = 'Button';

// ============================================
// INPUT
// ============================================

export const Input = forwardRef(({ 
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  inputClassName = '',
  required = false,
  ...props 
}, ref) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            error ? 'border-red-500' : 'border-foreground/10',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            inputClassName
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
            {rightIcon}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={clsx('mt-1.5 text-xs', error ? 'text-red-500' : 'text-foreground/60')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

// ============================================
// TEXTAREA
// ============================================

export const Textarea = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  textareaClassName = '',
  required = false,
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          error ? 'border-red-500' : 'border-foreground/10',
          textareaClassName
        )}
        {...props}
      />
      {(error || helperText) && (
        <p className={clsx('mt-1.5 text-xs', error ? 'text-red-500' : 'text-foreground/60')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});
Textarea.displayName = 'Textarea';

// ============================================
// SELECT
// ============================================

export const Select = forwardRef(({ 
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  className = '',
  selectClassName = '',
  required = false,
  ...props 
}, ref) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          error ? 'border-red-500' : 'border-foreground/10',
          selectClassName
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <p className={clsx('mt-1.5 text-xs', error ? 'text-red-500' : 'text-foreground/60')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});
Select.displayName = 'Select';

// ============================================
// SPINNER
// ============================================

const spinnerSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        spinnerSizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================
// BADGE
// ============================================

const badgeVariants = {
  default: 'bg-foreground/10 text-foreground',
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  className = '' 
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-full',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-green-500',
          variant === 'warning' && 'bg-yellow-500',
          variant === 'error' && 'bg-red-500',
          variant === 'info' && 'bg-blue-500',
          variant === 'primary' && 'bg-primary',
          variant === 'secondary' && 'bg-secondary',
          variant === 'default' && 'bg-foreground/50',
        )} />
      )}
      {children}
    </span>
  );
};

// ============================================
// CARD
// ============================================

export const Card = ({ 
  children, 
  className = '',
  padding = true,
  hover = false,
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-foreground/10 shadow-sm',
        padding && 'p-6',
        hover && 'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={clsx('mb-4', className)}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={clsx('text-lg font-semibold', className)}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={clsx('text-sm text-foreground/60 mt-1', className)}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={clsx('mt-4 pt-4 border-t border-foreground/10', className)}>{children}</div>
);

// ============================================
// ALERT
// ============================================

const alertVariants = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export const Alert = ({ 
  children, 
  variant = 'info', 
  title,
  onClose,
  className = '' 
}) => {
  return (
    <div
      className={clsx(
        'rounded-xl border p-4',
        alertVariants[variant],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// AVATAR
// ============================================

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar = ({ 
  src, 
  alt = '', 
  name = '',
  size = 'md',
  className = '' 
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={clsx(
          'rounded-full object-cover',
          avatarSizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center',
        avatarSizes[size],
        className
      )}
    >
      {initials || '?'}
    </div>
  );
};

// ============================================
// EMPTY STATE
// ============================================

export const EmptyState = ({ 
  icon,
  title,
  description,
  action,
  className = '' 
}) => {
  return (
    <div className={clsx('text-center py-12', className)}>
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/30">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-foreground/60 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
};

// ============================================
// SKELETON
// ============================================

export const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'w-10 h-10 rounded-full',
    thumbnail: 'w-16 h-16 rounded-lg',
    card: 'h-32 rounded-2xl',
  };

  return (
    <div
      className={clsx(
        'bg-foreground/10 animate-pulse',
        variants[variant],
        className
      )}
    />
  );
};

// ============================================
// DIVIDER
// ============================================

export const Divider = ({ 
  label,
  className = '' 
}) => {
  if (label) {
    return (
      <div className={clsx('relative my-6', className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-foreground/50">{label}</span>
        </div>
      </div>
    );
  }

  return <hr className={clsx('border-foreground/10 my-4', className)} />;
};
