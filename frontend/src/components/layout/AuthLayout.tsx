import { Outlet } from 'react-router-dom';
import { env } from '@/config/env';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{env.APP_NAME}</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        <div className="card p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
