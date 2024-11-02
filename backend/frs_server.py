from fastapi import FastAPI, File, UploadFile , HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from pydantic import BaseModel
import base64
import numpy as np
import cv2
from ultralytics import YOLO
from keras_facenet import FaceNet
from exception_handler import ExceptionHandler
import os
import pandas as pd
from pymongo import MongoClient
from bson.json_util import dumps
import json


from predict import enhance_and_reduce_noise,detect_face
from train import train_images

client = MongoClient("mongodb+srv://neeraj3000:wGwt4evpDZq2LKk6@cluster0.7wryp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['student']
collection = db['student_details']
r20_collection = db['r20']

class ImageBatch(BaseModel):
    images: list[str]

class ImageData(BaseModel):
    image: str

class Student(BaseModel):
    image: str
    formData: dict

class StudentData(BaseModel):
    name: str
    studentId: str
    batch: str
    branch: str
    section: str

class studentDetails(BaseModel):
    studentId: str

CSV_FILE_PATH = 'locals/data.csv'

app = FastAPI()

cropper = YOLO('locals/neeraj_yolo.pt')
embedder = FaceNet()

# Function to crop faces
@ExceptionHandler
def crop_faces(img):
    def return_crop_face(img, cropper):
        results = cropper.predict(img)
        result = results[0]
        if len(result.boxes) == 0:
            print("No face detected")
            return None  
        box = result.boxes
        confidence = box.conf[0]
        if confidence < 0.85:  
            print("Low confidence detection")
            return None
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = round(x1.item()), round(y1.item()), round(x2.item()), round(y2.item())
        h, w, ch = img.shape
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        face = img[y1:y2, x1:x2]
        return face
    # faces = []
    # for img in images:
    face = return_crop_face(img, cropper)
    if face is not None:  # Only append valid faces
        face = cv2.cvtColor(face, cv2.COLOR_RGB2BGR)
        # faces.append(face)
    else:
        # print("No valid face detected in this image")
        pass

    return face

@ExceptionHandler
def get_embeddings(face , embedder):
    face = face.astype('float32')
    face = np.expand_dims(face,axis=0)
    return embedder.embeddings(face)

@ExceptionHandler
def append_to_csv(data):
    if not os.path.exists(CSV_FILE_PATH):
        df = pd.DataFrame(columns=["Name", "Student ID", "Batch", "Branch", "Section"])
        df.to_csv(CSV_FILE_PATH, index=False)
    
    df = pd.read_csv(CSV_FILE_PATH)

    new_data = pd.DataFrame({
        "Name": [data.name],
        "Student ID": [data.studentId],
        "Batch": [data.batch],
        "Branch": [data.branch],
        "Section": [data.section]
    })

    # Append the new data to the existing data
    df = pd.concat([df, new_data], ignore_index=True)

    # Write the updated DataFrame back to the CSV file
    df.to_csv(CSV_FILE_PATH, index=False)

@ExceptionHandler
def get_student_data(data):
    return [data.name,data.studentId,data.batch,data.branch,data.section]

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
            image_data = base64.b64decode(image.split(",")[1])
            np_arr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
            image_list.append(img)
        train_images(image_list,"janardhan")
        return {"message": f"{len(data.images)} images processed successfully!", "image_count": len(image_list)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


embeddings_list = []
count = 0
total_embeddings = 60

@app.post("/verify-frame")
async def verify(data: Student):
    global embeddings_list
    global count
    global total_embeddings
    if len(embeddings_list) >= total_embeddings:
        return {"status": "stop", "message": "Maximum embedding count reached, stopping further frames"}
    image_data = base64.b64decode(data.image.split(",")[1])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    face = crop_faces(img)
    if face is not None:
        embedding = get_embeddings(face, embedder)
        embeddings_list.append(embedding)
        count = count + 1
        print(f"embedding {count} taken")
        if(len(embeddings_list) >= total_embeddings):
            embeddings = [embed.tolist() for embed in embeddings_list]
            document = {
                "name" : data.formData['formData']['name'],
                "id" : data.formData['formData']['studentId'],
                "batch" : data.formData['formData']['batch'],
                "branch" : data.formData['formData']['branch'],
                "section" : data.formData['formData']['section'],
                "embeddings" : embeddings
            }
            collection.insert_one(document)
            print("Data uploaded to mongodb")

            embeddings_list.clear()
            count = 0
            return {"status": "stop", "message": "Reached maximum embedding count"}
        else:
            return {"status": "success", "message": "Face detected", "total": total_embeddings}
    else:
        return {"status": "low_confidence", "message": "Low confidence, ensure that you are in good lighting"}
    
# @app.post("/student-details")
# async def student_details(details: studentDetails):
#     stu_id = details.studentId
#     result = r20_collection.find({'studentId':stu_id})
#     return result

@app.post('/student-details')
async def student_details(details: studentDetails):
    stu_id = details.studentId
    result = r20_collection.find_one({'studentId': stu_id})
    if result:
        return {
            "name": result.get("name", ""),
            "branch": result.get("branch", ""),
            "section": result.get("section", "")
        }
    else:
        return {"error": "Student ID not found"}


@app.post("/submit-student-data")
async def submit_student_data(student_data: StudentData):
    try:
        # Append the student data to the CSV file
        append_to_csv(student_data)
        data = get_student_data(student_data)
        return {"success": True, "message": "Data stored successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/batches")
async def get_batches():
    return ["R19", "R20", "R21", "R22"]

@app.get("/branches")
async def get_branches():
    return ["CS", "EC", "EE", "ME", "MM", "CH", "CE"]

@app.get("/sections")
async def get_sections():
    return ["A", "B", "C", "D", "E", "F"]

# Endpoint to fetch filtered data based on selected batch, branch, and section
@app.get("/filtered-data")
async def get_filtered_data(
    batch: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    section: Optional[str] = Query(None)
):
    # Build the query dynamically based on the filters provided
    query = {}
    if batch:
        query["batch"] = batch
    if branch:
        query["branch"] = branch
    if section:
        query["section"] = section

    # Fetch the filtered data from MongoDB and exclude the _id field
    results = list(collection.find(query, {"_id": 0}))

    # Format results and add a tick mark indicator for embeddings
    formatted_results = [
        {**result, "embeddings": bool(result.get("embeddings"))} for result in results
    ]

    return formatted_results

@app.delete("/delete-student/{student_id}")
async def delete_student(student_id: str):
    result = collection.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

    

    
