import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = () => {
  const { user } = useAuthStore();

  // If there is no user, redirect to the /auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If the user is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
