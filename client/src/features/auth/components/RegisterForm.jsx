import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import FormField from '../../../components/forms/FormField.jsx';
import Input from '../../../components/forms/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import { normalizeErrorMessage, getErrorDetails } from '../../../utils/error.js';

/**
 * Accessible User Registration Form
 *
 * Submits only { name, email, password } to the backend.
 * Enforces client-side password confirmation without submitting the confirmation field.
 *
 * @param {object} props
 * @param {() => void} [props.onSuccess] - Callback executed on successful registration
 */
export default function RegisterForm({ onSuccess }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      newErrors.name = 'Name must be between 2 and 100 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else if (password.length > 128) {
      newErrors.password = 'Password cannot exceed 128 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Strictly submit only { name, email, password }
      await register({ name, email, password });
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      const details = getErrorDetails(err);
      if (details && typeof details === 'object') {
        setErrors(details);
      }
      setGeneralError(
        normalizeErrorMessage(err, 'Unable to complete registration. Please verify your details.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      {generalError && (
        <Alert
          variant="error"
          title="Registration Failed"
          onDismiss={() => setGeneralError(null)}
          className="auth-form__alert"
        >
          {generalError}
        </Alert>
      )}

      <FormField
        id="register-name"
        label="Full Name"
        required
        error={errors.name}
      >
        <Input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Jane Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: null }));
            }
          }}
          hasError={Boolean(errors.name)}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        id="register-email"
        label="Email Address"
        required
        error={errors.email}
      >
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="e.g. jdoe@university.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: null }));
            }
          }}
          hasError={Boolean(errors.email)}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        id="register-password"
        label="Password"
        required
        helperText="Must be at least 8 characters long."
        error={errors.password}
      >
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: null }));
            }
          }}
          hasError={Boolean(errors.password)}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        id="register-confirm-password"
        label="Confirm Password"
        required
        error={errors.confirmPassword}
      >
        <Input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }
          }}
          hasError={Boolean(errors.confirmPassword)}
          disabled={isSubmitting}
        />
      </FormField>

      <div className="auth-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="auth-form__submit-btn"
        >
          Create Account
        </Button>
      </div>
    </form>
  );
}
