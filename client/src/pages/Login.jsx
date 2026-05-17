import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset } from '../store/authSlice';
import { HardDrive } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      alert(message);
    }

    if (isSuccess || user) {
      navigate('/');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const userData = { email, password };
    dispatch(login(userData));
  };

  return (
    <div className="min-h-screen bg-driveGray flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-driveBorder w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <HardDrive className="text-driveBlue w-12 h-12 mb-2" />
          <h1 className="text-2xl font-medium text-driveText">Sign in to DriveX</h1>
          <p className="text-gray-500 mt-1">Continue to your files</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-driveText mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-driveBlue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-driveText mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-driveBlue focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-driveBlue text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-driveBlue hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
