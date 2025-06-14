import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MobileForm, MobileFormField, MobileFormActions } from '@/components/ui/mobile-form';
import { MobileInput } from '@/components/ui/mobile-input';
import { MobileButton } from '@/components/ui/mobile-button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.register(username, email, password);
      toast({ title: 'Registration successful' });
      navigate('/login');
    } catch {
      toast({ title: 'Registration failed', variant: 'destructive' });
    }
  };

  return (
    <div className="mobile-container">
      <MobileForm onSubmit={handleSubmit} className="mt-20">
        <MobileFormField label="Username" required>
          <MobileInput value={username} onChange={e => setUsername(e.target.value)} required />
        </MobileFormField>
        <MobileFormField label="Email" required>
          <MobileInput type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </MobileFormField>
        <MobileFormField label="Password" required>
          <MobileInput type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </MobileFormField>
        <MobileFormActions>
          <MobileButton type="submit" fullWidth>Register</MobileButton>
        </MobileFormActions>
        <p className="text-center text-sm mt-4">
          Already have an account? <Link to="/login" className="underline">Login</Link>
        </p>
      </MobileForm>
    </div>
  );
};

export default Register;
