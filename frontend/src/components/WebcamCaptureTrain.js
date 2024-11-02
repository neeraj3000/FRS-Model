import React, { useState, useEffect, useRef } from "react";

const WebcamCaptureTrain = () => {
  const videoRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false); // To control capture state

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

  // Send all captured images to FastAPI backend after 60 frames
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
    setIsCapturing(true); // Set capture state to true
  };

  // Capture image every 1 second (60 times) when isCapturing is true
  useEffect(() => {
    let intervalId;
    if (isCapturing) {
      intervalId = setInterval(() => {
        if (capturedImages.length < 60) {
          const newImage = captureFrame();
          setCapturedImages((prevImages) => [...prevImages, newImage]);
        } else {
          clearInterval(intervalId);
          sendAllImages(capturedImages); // Send all images to backend once captured
          setIsCapturing(false); // Stop capturing after sending images
        }
      }, 200); // 1 second interval
    }

    return () => clearInterval(intervalId);
  }, [isCapturing, capturedImages]);

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
      <h1>Capturing Images...</h1>
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