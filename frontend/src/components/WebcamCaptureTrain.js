import React, { useState, useEffect, useRef } from "react";

const WebcamCaptureTrain = () => {
  const videoRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Function to capture the image from the video stream
  const captureFrame = () => {
    const videoElement = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg"); // Convert to base64 image
  };

  // Function to send all images to backend after capturing 5 frames
  const sendAllImages = async (images) => {
    try {
      await fetch("http://localhost:8000/upload-image-train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images }),
      });
      console.log("All images sent!");
    } catch (error) {
      console.error("Error sending images to the backend", error);
    }
  };

  // Function to start capturing images
  const startCapture = () => {
    setCapturedImages([]); // Reset the captured images
    setIsCapturing(true); // Start capturing process
  };

  // Capture images every 200ms when isCapturing is true
  useEffect(() => {
    let captureCount = 0;
    let intervalId;

    if (isCapturing) {
      intervalId = setInterval(() => {
        if (captureCount < 5) {
          const newImage = captureFrame();
          setCapturedImages((prevImages) => [...prevImages, newImage]);
          captureCount += 1;
        } else {
          clearInterval(intervalId);
          sendAllImages(capturedImages).then(() => {
            setIsCapturing(false); // Stop capturing after sending images
          });
        }
      }, 200); // Capture every 200ms
    }

    return () => clearInterval(intervalId);
  }, [isCapturing]);

  // Start video stream
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam", err));
  }, []);

  return (
    <div>
      <h1>Webcam Image Capture</h1>
      {/* Show video stream */}
      <video
        ref={videoRef}
        autoPlay
        style={{ width: "400px", height: "300px" }}
      ></video>

      {/* Button to start capture */}
      <button onClick={startCapture} disabled={isCapturing}>
        Start Capture
      </button>

      {isCapturing && <p>Capturing images...</p>}
    </div>
  );
};

export default WebcamCaptureTrain;
