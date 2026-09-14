import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";

import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Shipments from "./pages/Shipments";
import ImportExcel from "./pages/ImportExcel";
import ShipmentDetail from "./pages/ShipmentDetail";
import AddShipment from "./pages/AddShipment";
import EditShipment from "./pages/EditShipment";
import Settings from "./pages/Settings";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/shipments/new" element={<AddShipment />} />
            <Route path="/shipments/:id/edit" element={<EditShipment />} />
            <Route path="/shipments/:id" element={<ShipmentDetail />} />
            <Route path="/import" element={<ImportExcel />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;