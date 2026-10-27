import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import FormField from '../../../components/forms/FormField.jsx';
import Input from '../../../components/forms/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import { normalizeErrorMessage, getErrorDetails } from '../../../utils/error.js';

/**
 * Accessible User Login Form
 *
 * @param {object} props
 * @param {() => void} [props.onSuccess] - Callback executed on successful authentication
 */
export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
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
      await login({ email, password });
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      const details = getErrorDetails(err);
      if (details && typeof details === 'object') {
        setErrors(details);
      }
      setGeneralError(
        normalizeErrorMessage(err, 'Invalid email or password. Please try again.'),
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
          title="Sign In Failed"
          onDismiss={() => setGeneralError(null)}
          className="auth-form__alert"
        >
          {generalError}
        </Alert>
      )}

      <FormField
        id="login-email"
        label="Email Address"
        required
        error={errors.email}
      >
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="e.g. user@university.edu"
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
        id="login-password"
        label="Password"
        required
        error={errors.password}
      >
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
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

      <div className="auth-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="auth-form__submit-btn"
        >
          Sign In
        </Button>
      </div>
    </form>
  );
}
