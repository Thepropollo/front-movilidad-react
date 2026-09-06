import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      icon,
      error,
      id,
      className = '',
      containerClassName = '',
      containerStyle,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div
        className={`form-group ${containerClassName}`}
        style={containerStyle}
      >
        {label && (
            <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div className="input-container">
          {icon && <span className="input-icon">{icon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`form-input ${error ? 'border-red-500 focus:ring-red-500/20' : ''} ${className}`}
            style={icon ? undefined : { paddingLeft: '16px' }}
            {...props}
          />
        </div>
        {error && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--danger)',
              marginTop: '4px',
              display: 'block',
              fontWeight: 500,
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
