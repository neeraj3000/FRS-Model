import numpy as np
from ultralytics import YOLO
import pickle
from tensorflow.keras.models import load_model
from keras_facenet import FaceNet
import cv2
from exception_handler import ExceptionHandler
import os

file_path = 'locals/enocoder_classes_v3.npy'
file_path2 = 'locals/svc_model_v3.pkl'
embedder = FaceNet()
cropper = YOLO('locals/neeraj_yolo.pt')



CONF_THRESHOLD = 0.70
if os.path.exists(file_path):
    try:
        encoder_classes = np.load(file_path, allow_pickle=True)
        print("Encoder classes loaded successfully.")
    except Exception as e:
        print(f"Error loading encoder classes: {e}")
else:
    print(f"File not found: {file_path}")
    encoder_classes = None  # Set to None or a default valuecropper = YOLO('locals/neeraj_yolo.pt')
if os.path.exists(file_path2):
    try:
        with open(file_path2, 'rb') as file:
            model = pickle.load(file)
            print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading the model: {e}")
else:
    print(f"File not found: {file_path2}")
    model = None  # Set to None or handle appropriatelyembedder = FaceNet()

@ExceptionHandler
def enhance_and_reduce_noise(image, save_path='enhanced_minimal_soften_image.jpg'):
    # Load the image
    # image = cv2.imread(image_path)
    # Resize the image to reduce processing time (e.g., 50% of original size)
    image_resized = cv2.resize(image, (image.shape[1] // 2, image.shape[0] // 2))
    # Convert image to LAB color space (Lightness, A and B channels)
    lab = cv2.cvtColor(image_resized, cv2.COLOR_BGR2LAB)
    # Split the LAB image to L, A, and B channels
    l, a, b = cv2.split(lab)
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to the L channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    # Merge the CLAHE enhanced L channel with the a and b channels
    enhanced_lab = cv2.merge((cl, a, b))
    # Convert back to BGR color space
    enhanced_image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    # Adjust brightness and contrast
    alpha = 1.1  # Lower contrast control
    beta = 10    # Lower brightness control
    enhanced_image = cv2.convertScaleAbs(enhanced_image, alpha=alpha, beta=beta)
    # Apply a very light bilateral filter for minimal noise reduction
    denoised_image = cv2.bilateralFilter(enhanced_image, d=3, sigmaColor=30, sigmaSpace=30)
    # Apply a very mild Gaussian blur to minimally soften the image
    softened_image = cv2.GaussianBlur(denoised_image, (1, 1), 0)
    # Save the final enhanced image with minimal softening
    # cv2.imwrite(save_path, softened_image)
    return softened_image
# Call the function with the uploaded image

@ExceptionHandler
def get_embeddings(face , embedder):
    print('get3')
    face = face.astype('float32')
    face = np.expand_dims(face,axis=0)
    return embedder.embeddings(face)


@ExceptionHandler
def get_cropped_face(img,cropper):
    print('get2')
    result = cropper.predict(img)
    result = result[0]
    # for i, box in enumerate(result.boxes):
    box = result.boxes
    print(box)
    confidence = box.conf[0]
    if confidence >= CONF_THRESHOLD:
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = round(x1.item()), round(y1.item()), round(x2.item()), round(y2.item())
        # print(f"Detected Bounding Box {i+1}: x1={x1}, y1={y1}, x2={x2}, y2={y2}")
        h,w = 160,160
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        face = img[y1:y2, x1:x2]
        return face
    return None
    
@ExceptionHandler
def detect_face(img,embedder=embedder,cropper=cropper):
    print('get 1')
    img = cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
    img = cv2.resize(img,(160,160))
    face = get_cropped_face(img,cropper)
    embeddings = get_embeddings(face,embedder)
    print(embeddings.shape)
    pred = model.predict(embeddings)
    print(encoder_classes[pred])
    return encoder_classes[pred]
    