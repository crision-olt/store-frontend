import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/pages/login'
import { AccessPage } from '@/pages/access'
import { AllergensPage } from '@/pages/allergens'
import { CategoriesPage } from '@/pages/categories'
import { DiscountsPage } from '@/pages/discounts'
import { OffersPage } from '@/pages/offers'
import { ProductsPage } from '@/pages/products'
import { RegisterPage } from '@/pages/register'
import { TablesPage } from '@/pages/tables'
import { UsersPage } from '@/pages/users'
import { ZonesPage } from '@/pages/zones'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/allergens" element={<AllergensPage />} />
      <Route path="/discounts" element={<DiscountsPage />} />
      <Route path="/tables" element={<TablesPage />} />
      <Route path="/zones" element={<ZonesPage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/access" element={<AccessPage />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}
