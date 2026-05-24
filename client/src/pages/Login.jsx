import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, reset } from '../store/authSlice';
import { HardDrive } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isError, isSuccess, message } = useSelector(
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

  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleLogin(credentialResponse.credential));
  };

  const handleGoogleError = () => {
    alert('Google Sign-In was unsuccessful. Try again later.');
  };

  return (
    <div className="min-h-screen bg-driveGray flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-driveBorder w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <HardDrive className="text-blue-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800">DriveX</h1>
          <p className="text-gray-500 mt-2 text-center">Secure cloud storage for all your personal files.</p>
        </div>

        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
            text="continue_with"
            width="100%"
          />
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
