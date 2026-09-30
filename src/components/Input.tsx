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
            {props.required && (
              <span className="form-required-asterisk" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="input-container">
          {icon && <span className="input-icon">{icon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`form-input ${className}`.trim()}
            style={icon ? undefined : { paddingLeft: '16px' }}
            {...props}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
