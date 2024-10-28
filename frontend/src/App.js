import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import WebcamCapturePredict from './components/WebcamCapturePredict';
import WebcamCaptureTrain from './components/WebcamCaptureTrain';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar with Links */}
        <nav>
          <ul>
            <li>
              <Link to="/predict">Predict</Link>
            </li>
            <li>
              <Link to="/train">Train</Link>
            </li>
          </ul>
        </nav>

        {/* Define Routes */}
        <Routes>
          <Route path="/predict" element={<WebcamCapturePredict />} />
          <Route path="/train" element={<WebcamCaptureTrain />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
