import React, { useState, useEffect, useRef } from "react";
import { Button, Typography, Grid, Paper, Box, Card, CardContent } from "@mui/material";
import { styled } from "@mui/system";
import { useLocation, useNavigate } from "react-router-dom";
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const StyledVideo = styled('video')(({ theme }) => ({
  width: '100%',
  height: 'auto',
  borderRadius: '10px',
  objectFit: 'cover',
  [theme.breakpoints.up('sm')]: {
    width: '400px',
    height: '300px',
  },
}));

const InfoCard = styled(Card)({
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: '#f8f9fa',
  textAlign: 'center',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  marginTop: '10px',
});

const BlurOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'black',
  zIndex: 10,
});

const MessageBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center',
  animation: 'fade-in 1s ease-out',
  '@keyframes fade-in': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
});

const AnimatedHourglass = styled(HourglassEmptyIcon)({
  marginLeft: '10px',
  fontSize: '25px',
  animation: 'spin 2s infinite linear',
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(32deg)' },
  },
});

const WebcamCapture = () => {
  const videoRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [curFrame, setCurFrame] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state;

  // Function to capture a single frame
  const captureFrame = () => {
    const videoElement = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  // Send all 2 captured images as a batch to the backend
  const sendImagesBatch = async (images) => {
    try {
      const response = await fetch("http://localhost:8000/verify-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, formData }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setStatusMessage("All images successfully sent!");
        setIsRedirecting(true);

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/student");
        }, 3000);
      } else {
        setStatusMessage(data.message || "Failed to process images.");
      }
    } catch (error) {
      console.error("Error sending images to the backend", error);
      setStatusMessage("Error connecting to the backend.");
    }
  };

  // Function to start capturing images
  const startCapture = () => {
    setCapturedImages([]);
    setStatusMessage("");
    setCurFrame(0);
    setIsCapturing(true);
  };

  // Capture 2 frames in 1-second intervals and send them as a batch
  useEffect(() => {
    let intervalId;
    if (isCapturing) {
      intervalId = setInterval(() => {
        if (capturedImages.length < 2) {
          const newImage = captureFrame();
          setCapturedImages((prevImages) => [...prevImages, newImage]);
          setCurFrame((prev) => prev + 1);
        } else {
          clearInterval(intervalId);
          setIsCapturing(false);
          sendImagesBatch(capturedImages); // Send all captured images
        }
      }, 1000); // Capture every second
    }

    return () => clearInterval(intervalId);
  }, [isCapturing, capturedImages]);

  // Start video stream on component mount
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam", err));
  }, []);

  return (
    <>
      {isRedirecting && (
        <BlurOverlay>
          <MessageBox>
            <Typography variant="h5">Please wait...</Typography>
            <AnimatedHourglass />
          </MessageBox>
        </BlurOverlay>
      )}

      <Box style={{ filter: isRedirecting ? 'blur(8px)' : 'none' }}>
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="center"
          style={{ height: '100vh', backgroundColor: '#f4f7f9' }}
        >
          <Grid item xs={12}>
            <Typography variant="h4" align="center" gutterBottom>
              Real-Time Face Verification
            </Typography>
          </Grid>

          <Grid item xs={12} md={6} style={{ display: 'flex', justifyContent: 'center' }}>
            <Paper
              elevation={3}
              style={{ padding: '20px', borderRadius: '15px', width: '100%', maxWidth: '400px' }}
            >
              <StyledVideo ref={videoRef} autoPlay muted />
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <InfoCard>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Current Frames Captured
                </Typography>
                <Typography variant="h5" color="primary">
                  {curFrame} / 2
                </Typography>
              </CardContent>
            </InfoCard>
          </Grid>

          <Grid item xs={12} style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={startCapture}
              disabled={isCapturing || curFrame === 2}
              size="large"
            >
              {curFrame === 2 ? "Capture Complete" : "Start Capture"}
            </Button>
          </Grid>

          {statusMessage && (
            <Grid item xs={12}>
              <Typography
                variant="body1"
                align="center"
                style={{ marginTop: '20px', color: 'black' }}
              >
                {statusMessage}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </>
  );
};

export default WebcamCapture;