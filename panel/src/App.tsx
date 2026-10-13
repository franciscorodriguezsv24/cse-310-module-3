import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';

import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { BranchesPage } from './pages/BranchesPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductsPage } from './pages/ProductsPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/:id', element: <ProductFormPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: '*', element: <Navigate to="/products" replace /> },
    ],
  },
]);

/** Root component: auth state plus the router. */
export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
