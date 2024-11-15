// components/AuthComponent.js
import { useState, useEffect } from 'react';
import { registerUser , loginUser , logoutUser  } from '../lib/auth';
import { auth } from '../firebase'; // Import Firebase auth

export default function AuthComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser ] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser (user);
      } else {
        setUser (null);
      }
    });
    
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await loginUser (email, password);
        console.log('User  logged in successfully');
      } else {
        await registerUser (email, password);
        console.log('User  registered successfully');
        setIsLogin(true); // Switch to login after registration
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser ();
    console.log('User  logged out successfully');
  };

  return (
    <div className="flex justify-center items-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        {user ? (
          // Profile View
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.email}!</h2>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition duration-200"
            >
              Logout
            </button>
          </div>
        ) : (
          // Login/Register Form
          <>
            <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
              >
                {isLogin ? 'Login' : 'Register'}
              </button>
            </form>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-blue-500 hover:underline"
            >
              Switch to {isLogin ? 'Register' : 'Login'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}