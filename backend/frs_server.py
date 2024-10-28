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
    label : str

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
        print('At FRS server, starting image processing...')
        image_list = []
        label = data.label  # Extract the label
        print(f'Label: {label}')

        for i, image in enumerate(data.images):
            # print(f'Processing image {i + 1}/{len(data.images)}')
            try:
                # Decode base64 image
                image_data = base64.b64decode(image.split(",")[1])
                np_arr = np.frombuffer(image_data, np.uint8)
                
                # Decode to OpenCV image format
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if img is None:
                    raise ValueError(f"Failed to decode image {i + 1}")
                
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                image_list.append(img)
            except Exception as e:
                print(f"Error processing image {i + 1}: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Error processing image {i + 1}")

        # Train with images and label
        train_images(image_list, label)
        print(f"Successfully processed {len(data.images)} images")

        return {"message": f"{len(data.images)} images processed successfully!", "image_count": len(image_list)}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
