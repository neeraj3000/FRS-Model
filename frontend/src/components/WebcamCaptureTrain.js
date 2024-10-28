import React, { useState, useEffect, useRef } from "react";

const WebcamCaptureTrain = () => {
  const videoRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [label, setLabel] = useState(""); // New state to store label
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFrame = () => {
    const videoElement = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  const sendAllImages = async (images, label) => {
    try {
      await fetch("http://localhost:8000/upload-image-train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images, label }), // Include label
      });
      console.log("All images sent!");
    } catch (error) {
      console.error("Error sending images to the backend", error);
    }
  };

  const startCapture = () => {
    setCapturedImages([]);
    setIsCapturing(true);
  };

  useEffect(() => {
    let intervalId;
    if (isCapturing) {
      intervalId = setInterval(() => {
        if (capturedImages.length < 60) {
          const newImage = captureFrame();
          setCapturedImages((prevImages) => [...prevImages, newImage]);
        } else {
          clearInterval(intervalId);
          sendAllImages(capturedImages, label); // Send label with images
          setIsCapturing(false);
        }
      }, 100);
    }

    return () => clearInterval(intervalId);
  }, [isCapturing, capturedImages, label]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam", err));
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Capturing Images...</h1>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-center mb-3">
        <video
          ref={videoRef}
          autoPlay
          style={{ width: "400px", height: "300px" }}
          className="border rounded shadow-sm"
        ></video>
      </div>
      <div className="text-center">
        <button
          className="btn btn-primary"
          onClick={startCapture}
          disabled={!label || isCapturing}
        >
          Start Capture
        </button>
      </div>
      {isCapturing && <p className="text-center mt-3">Capturing images...</p>}
    </div>
  );
};

export default WebcamCaptureTrain;
