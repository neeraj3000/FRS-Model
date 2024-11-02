import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const WebcamCapturePredict = () => {
  const webcamRef = useRef(null);
  const [detectionResult, setDetectionResult] = useState(''); // State to store the detection result
  const [capturedImage, setCapturedImage] = useState(''); // State to store the captured image

  // Function to capture the image and send it to the backend
  const captureAndSend = async () => {
    if (webcamRef.current) {
      // Capture the screenshot from the webcam
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc); // Set the captured image to display it

      if (imageSrc) {
        try {
          // Convert the base64 image to a Blob
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          const formData = new FormData();
          formData.append('file', blob, 'image.jpg'); // Append the blob to formData

          // Send the image using axios
          let apiResponse = await axios.post('http://127.0.0.1:8000/upload-image-predict', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          console.log("Image sent");
          console.log(apiResponse);

          // Extract and update the detection result
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
    <div>
      <h2>Webcam Capture</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={400}
        height={300}
      />
      <button onClick={captureAndSend}>Capture and Send</button>

      {/* Display the captured image */}
      {capturedImage && (
        <div>
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured" style={{ width: '400px', height: '300px', margin: '10px 0' }} />
        </div>
      )}

      {/* Display the detection result */}
      {detectionResult && (
        <div>
          <h3>Detection Result:</h3>
          <p>{detectionResult}</p>
        </div>
      )}
    </div>
  );
};

export default WebcamCapturePredict;