import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function parseUser() {
  try {
    const raw = localStorage.getItem('resqUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Only users with role "admin" may access children. Others → /login.
 */
const ProtectedAdminRoute = ({ children }) => {
  const location = useLocation();
  const user = parseUser();
  const token = localStorage.getItem('resqToken');

  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedAdminRoute;
