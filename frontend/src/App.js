// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;


import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WebcamCapture from './components/WebcamCapture';
import StudentForm from './components/StudentForm'
// import WebcamCapturePredict from './components/WebcamCapturePredict';
// import WebcamCaptureTrain from './components/WebcamCaptureTrain';
import Admin from './components/Admin';
import Registrations from './components/Registrations';

function App() {
  return (
    // <div className="App">
    //   {/* <WebcamCapturePredict>
    //   </WebcamCapturePredict> */}
    //   {/* <WebcamCaptureTrain>
    //   </WebcamCaptureTrain> */}
    //   <WebcamCapture>
    //   </WebcamCapture>
    // </div>

    <Router>
      <Routes>
        {/* Form page for entering student details */}
        <Route path="/" element={<Admin />} />
        <Route path="/student" element={<StudentForm />} />

        {/* Webcam capture page */}
        <Route path="/webcam-capture" element={<WebcamCapture />} />
        <Route path="/registrations" element={<Registrations />} />
      </Routes>
    </Router>
  );
}

export default App;