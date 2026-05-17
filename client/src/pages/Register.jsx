import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, reset } from '../store/authSlice';
import { HardDrive } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { name, email, password, confirmPassword } = formData;

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
    if (password !== confirmPassword) {
      alert('Passwords do not match');
    } else {
      const userData = { name, email, password };
      dispatch(register(userData));
    }
  };

  return (
    <div className="min-h-screen bg-driveGray flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-driveBorder w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <HardDrive className="text-driveBlue w-12 h-12 mb-2" />
          <h1 className="text-2xl font-medium text-driveText">Create a DriveX Account</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-driveText mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-driveBlue focus:border-transparent"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-driveText mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-driveBlue focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-driveBlue text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mt-4"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-driveBlue hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
