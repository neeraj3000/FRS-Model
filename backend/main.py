from fastapi import FastAPI, File, UploadFile , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import base64
import numpy as np
import cv2

from predict import enhance_and_reduce_noise,detect_face
from train import train_images

class ImageBatch(BaseModel):
    images: list[str]

app = FastAPI()

# Add CORS middleware to allow the React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this as per your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-image-predict")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Save the uploaded file locally or process it as needed
        contents = await file.read()
        with open(f"uploaded_{file.filename}", "wb") as f:
            f.write(contents)
        img = cv2.imread('uploaded_image.jpg')
        img = enhance_and_reduce_noise(img)
        detection = detect_face(img)
        return {"detection": detection[0]}
    except Exception as e:
        return {"error": str(e)}




@app.post("/upload-image-train")
async def upload_images(data: ImageBatch):
    try:
        image_list = []

        for i, image in enumerate(data.images):
            # Decode each base64 image to bytes
            image_data = base64.b64decode(image.split(",")[1])
            # Convert bytes to numpy array
            np_arr = np.frombuffer(image_data, np.uint8)
            # Decode numpy array into an image using OpenCV
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
            # Append the image to the list
            image_list.append(img)
        train_images(image_list,"janardhan")
        return {"message": f"{len(data.images)} images processed successfully!", "image_count": len(image_list)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))