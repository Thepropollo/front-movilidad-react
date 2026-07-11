import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'success' | 'outline';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  fullWidth = true,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getButtonClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn btn-secondary';
      case 'gold':
        return 'btn btn-gold';
      case 'danger':
        return 'btn btn-danger';
      case 'success':
        return 'btn btn-success';
      case 'outline':
        return 'btn btn-outline';
      case 'primary':
      default:
        return 'btn btn-primary';
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  // Spinner inherits white color on dark buttons, or primary brand color on light/outline buttons
  const spinnerBorderColor = ['secondary', 'outline'].includes(variant) 
    ? 'var(--color-primary)' 
    : '#ffffff';

  return (
    <button
      className={`${getButtonClass()} ${className}`}
      disabled={disabled || isLoading}
      style={buttonStyle}
      {...props}
    >
      {isLoading ? (
        <span 
          className="spinner" 
          style={{ 
            width: '16px', 
            height: '16px', 
            borderWidth: '2px', 
            borderLeftColor: spinnerBorderColor,
            borderColor: ['secondary', 'outline'].includes(variant) ? 'rgba(0, 40, 85, 0.15)' : 'rgba(255, 255, 255, 0.2)'
          }}
        ></span>
      ) : (
        <>
          {icon && <span className="btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
