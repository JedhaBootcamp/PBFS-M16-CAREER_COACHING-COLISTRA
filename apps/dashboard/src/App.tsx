import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { OrdersPage } from './features/orders/OrdersPage';
import { ShipmentsPage } from './features/shipments/ShipmentsPage';
import { ColistraProvider } from './shared/colistra/ColistraProvider';
import { AppLayout } from './shared/layout/AppLayout';

export function App() {
  return (
    <ColistraProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/orders" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="shipments/:shipmentId?" element={<ShipmentsPage />} />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ColistraProvider>
  );
}
