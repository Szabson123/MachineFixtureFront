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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SSEComponent />} />
        <Route path="/goldens" element={<GoldenList />} />
        <Route path="/goldens/main-table" element={<MainTable/>} />
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

        <Route path="/admin/main-page" element={<AdminMainPage />} />
        <Route path="/admin/process-list" element={<AdminProcessesPage />} />
        <Route path="/admin/mistake-list/:processId" element={<AdminProcessDetailsPage />} />
        <Route path="/admin/place-list/:placeId" element={<AdminPlaceDetailsPage />} />
        <Route path="/admin/groups" element={<AdminGroupsPage />} />
        <Route path="/admin/groups/:groupId/places" element={<GroupPlacesGrid />} />
        <Route path="/admin/products" element={<AdminProductList />} />
        <Route path="/admin/products/:productId" element={<AdminObjectsList />} />
        <Route path="/admin/products/:productId/objects/:objectId"element={<AdminObjectDetails />}/>
      </Routes>
    </Router>
  );
}

export default App;
