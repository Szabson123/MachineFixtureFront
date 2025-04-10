import './App.css';
import API from './components/api_machine';
import SSEComponent from './components/Sse_app';
import React, { useEffect } from 'react';
import axios from 'axios';

function App(){
  return (
    <div>
      <SSEComponent />
    </div>
  );
}

export default App;
