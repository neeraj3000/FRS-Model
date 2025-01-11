from fastapi import FastAPI, File, UploadFile , HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
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
client = MongoClient("mongodb+srv://neeraj3000:wGwt4evpDZq2LKk6@cluster0.7wryp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['student']
collection = db['student_details']
r20_collection = db['r20']

class ImageBatch(BaseModel):
    images: list[str]
    
class StudentDetails(BaseModel):
    batch: str
    branch: str
    name: str
    section: str
    studentId: str 
class CapturedImages(BaseModel):
    form_data: StudentDetails 
    images: List[str]  # List of base64 encoded image strings


class ImageData(BaseModel):
    image: str

class Student(BaseModel):
    image: str
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

@ExceptionHandler
def crop_faces(img):
    def return_crop_face(img, cropper):
        results = cropper.predict(img)
        result = results[0]
        if len(result.boxes) == 0:
            print("No face detected")
            return {'message':'No face detected' , 'status':0}  
        box = result.boxes
        confidence = box.conf[0]
        if confidence < 0.85:  
            print("Low confidence detection")
            return {'message':'No face detected' , 'status':1}
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

# @app.post("/upload-image-predict")
# async def upload_image(file: UploadFile = File(...)):
#     try:
#         # Save the uploaded file locally or process it as needed
#         contents = await file.read()
#         with open(f"uploaded_{file.filename}", "wb") as f:
#             f.write(contents)
#         img = cv2.imread('uploaded_image.jpg')
#         img = enhance_and_reduce_noise(img)
#         detection = detect_face(img)
#         return {"detection": detection[0]}
#     except Exception as e:
#         return {"error": str(e)}


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

@app.post("/verify-batch")
async def verify_batch(data: CapturedImages):
    global embeddings_list
    global count
    low_confidence_count = 0
    no_face_count = 0

    images_length = len(data.images)
    for image in data.images:
        image_data = base64.b64decode(image.split(",")[1])
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face = crop_faces(img)
        if isinstance(face,dict):
            if face.status == 0:
                no_face_count = no_face_count + 1
            else:
                low_confidence_count = low_confidence_count + 1
        else:
            embedding = get_embeddings(face, embedder)
            embeddings_list.append(embedding)
            count = count + 1
            print(f"embedding {count} taken")
    embeddings = [embed.tolist() for embed in embeddings_list]
    document = {
        "name" : data.form_data['formData']['name'],
        "id" : data.form_data['formData']['studentId'],
        "batch" : data.form_data['formData']['batch'],
        "branch" : data.form_data['formData']['branch'],
        "section" : data.form_data['formData']['section'],
        "embeddings" : embeddings
    }
    filter_query = {"id": data.form_data['formData']['studentId']}
    result = collection.replace_one(filter_query,document,upsert=True)
    embeddings_list.clear()
    if result.matched_count:
        print("Data uploaded to mongodb")
        if(count == images_length):
            count=0
            return {'status':200,'message':'your face embeddings are taken sucessfully taken'}
        else:
            count=0
            return {'status':207 ,'message':f'{count} only sucessfully taken. Resend {images_length - count} images'}
    else:
        count=0
        return {'status':400 , 'message':'Error in inserting the data into the database'}



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


