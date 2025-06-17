import './App.css';
import GoldenList from './components/GoldenSamples';
import SSEComponent from './components/Sse_app';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductList from './components/ProcessChecker/ProductList';
import ProductProcesses from './components/ProcessChecker/ProductProcesses';
import ProcessAction from './components/ProcessChecker/ProcessAction';
import ProcessActionRouter from './views/ProcessActionRouter'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SSEComponent />} />
        <Route path="/goldens" element={<GoldenList />} />
        <Route path="/process" element={<ProductList />} />
        <Route path="/process/:productId" element={<ProductProcesses />} />
        <Route path="/process/:productId/process-action" element={<ProcessAction />} />
        <Route path="/process/:productId/process-action/:actionType" element={<ProcessActionRouter />} />
      </Routes>
    </Router>
  );
}

export default App;
