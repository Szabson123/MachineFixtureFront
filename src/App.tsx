import './App.css';
import GoldenList from './components/GoldenSamples';
import SSEComponent from './components/Sse_app';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductList from './components/ProcessChecker/ProductList';
import ProductProcesses from './components/ProcessChecker/ProductProcesses';
import ProcessAction from './components/ProcessChecker/ProcessAction';
import FlowEditor from './components/ProcessNewGen/FlowProcess';

import AddObjectView from './components/Process/views/AddObjectView';
import ReceiveObjectView from './components/Process/views/ReceiveObjectView';
import MoveObjectView from './components/Process/views/MoveObjectView';
import TrashObjectView from './components/Process/views/TrashObjectView';

import ProductLogList from './components/Process/views/ProductLogList';
import SimpleCheckView from './components/Process/views/CheckObjectView';
import MachineStatuses from './components/Process/views/MachineStatuses';

import MainTable from './components/goldens/MainTable/MainTableComponent';
import AdminMainPage from './components/admin/admin-process/admin-main-page';
import AdminProcessesPage from './components/admin/admin-process/admin-process-list';
import AdminProcessDetailsPage from './components/admin/admin-process/admin-process-mistakes';
import AdminPlaceDetailsPage from './components/admin/admin-process/admin-place-mistake';
import AdminGroupsPage from './components/admin/admin-process/admin-groups';
import GroupPlacesGrid from './components/admin/admin-process/admin-group-place';
import AdminProductList from './components/admin/admin-process/admin-products-list';
import AdminObjectsList from './components/admin/admin-process/admin-object-list';
import AdminObjectDetails from './components/admin/admin-process/admin-object-details';
import AdminProductObjectDetailsPage from './components/admin/admin-process/admin-object-mistakes';
import Login from './components/User/user-login';
import RequireAuth from './components/User/RequiredAuth';


function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<SSEComponent />} />
        <Route path="/goldens" element={<GoldenList />} />
        <Route path="/goldens/main-table" element={<MainTable />} />
        <Route path="/process" element={<ProductList />} />
        <Route path="/traceability" element={<ProductLogList />} />
        <Route path="/machine-statuses" element={<MachineStatuses />} />
        <Route path="/process/:productId" element={<ProductProcesses />} />
        <Route path="/process/:productId/process-action" element={<ProcessAction />} />
        <Route path="/process/:productId/process-action/add" element={<AddObjectView />} />
        <Route path="/process/:productId/process-action/receive" element={<ReceiveObjectView />} />
        <Route path="/process/:productId/process-action/move" element={<MoveObjectView />} />
        <Route path="/process/:productId/process-action/trash" element={<TrashObjectView />} />
        <Route path="/process/:productId/process-action/check" element={<SimpleCheckView />} />
        <Route path="/new-flow" element={<FlowEditor />} />

        {/* PUBLIC ADMIN */}
        <Route path="/admin/main-page" element={<AdminMainPage />} />

        {/* 🔒 CHRONIONE ADMIN */}
        <Route path="/admin" element={<RequireAuth />}>
          <Route path="process-list" element={<AdminProcessesPage />} />
          <Route path="product-object/:objectId" element={<AdminProductObjectDetailsPage />} />
          <Route path="mistake-list/:processId" element={<AdminProcessDetailsPage />} />
          <Route path="place-list/:placeId" element={<AdminPlaceDetailsPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="groups/:groupId/places" element={<GroupPlacesGrid />} />
          <Route path="products" element={<AdminProductList />} />
          <Route path="products/:productId" element={<AdminObjectsList />} />
          <Route path="products/objects/:objectId" element={<AdminObjectDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
