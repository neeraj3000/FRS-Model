import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const WebcamCapturePredict = () => {
  const webcamRef = useRef(null);
  const [detectionResult, setDetectionResult] = useState('');
  const [capturedImage, setCapturedImage] = useState('');

  const captureAndSend = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);

      if (imageSrc) {
        try {
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          const formData = new FormData();
          formData.append('file', blob, 'image.jpg');

          let apiResponse = await axios.post('http://127.0.0.1:8000/upload-image-predict', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          console.log("Image sent");
          console.log(apiResponse);

          if (apiResponse.data && apiResponse.data.detection) {
            setDetectionResult(apiResponse.data.detection);
          } else {
            setDetectionResult('No detection result');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          setDetectionResult('Error occurred during detection');
        }
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Webcam Capture</h2>
      
      <div className="d-flex justify-content-center mb-3">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={400}
          height={300}
          className="border rounded shadow-sm"
        />
      </div>

      <div className="text-center mb-4">
        <button className="btn btn-primary" onClick={captureAndSend}>
          Capture and Send
        </button>
      </div>

      {capturedImage && (
        <div className="text-center mb-4">
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured" className="img-fluid border rounded shadow-sm" style={{ maxWidth: '100%', width: '400px', height: '300px', marginTop: '10px' }} />
        </div>
      )}

      {detectionResult && (
        <div className="text-center">
          <h3>Detection Result:</h3>
          <p className="alert alert-info">{detectionResult}</p>
        </div>
      )}
    </div>
  );
};

export default WebcamCapturePredict;
