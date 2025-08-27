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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SSEComponent />} />
        <Route path="/goldens" element={<GoldenList />} />
        <Route path="/process" element={<ProductList />} />
        <Route path="/traceability" element={<ProductLogList />} />
        <Route path="/process/:productId" element={<ProductProcesses />} />
        <Route path="/process/:productId/process-action" element={<ProcessAction />} />

        <Route path="/process/:productId/process-action/add" element={<AddObjectView />} />
        <Route path="/process/:productId/process-action/receive" element={<ReceiveObjectView />} />
        <Route path="/process/:productId/process-action/move" element={<MoveObjectView />} />
        <Route path="/process/:productId/process-action/trash" element={<TrashObjectView />} />

        <Route path="/process/:productId/process-action/check" element={<SimpleCheckView />} />

        <Route path="/new-flow" element={<FlowEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
