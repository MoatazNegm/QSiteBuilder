import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Lock } from 'lucide-react';

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      console.log('Login attempt:', data);
      setIsLoading(false);
      // Redirect to dashboard
      navigate('/');
    }, 1000);
  };

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@quickstor.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;