import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">QuickStor Admin</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to manage your website content</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;