import numpy as np
from ultralytics import YOLO
import pickle
from tensorflow.keras.models import load_model
from keras_facenet import FaceNet
import cv2
from exception_handler import ExceptionHandler


CONF_THRESHOLD = 0.70
encoder_classes = np.load('locals/restore/enocoder_classes_v3.npy',allow_pickle=True)
cropper = YOLO('locals/neeraj_yolo.pt')
model = pickle.load(open('locals/restore/svc_model_v3.pkl','rb'))
embedder = FaceNet()

@ExceptionHandler
def enhance_and_reduce_noise(image, save_path='enhanced_minimal_soften_image.jpg'):
    print('Enhancing the image...')
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
    print('Calculating face embeddinsg...')
    face = face.astype('float32')
    face = np.expand_dims(face,axis=0)
    return embedder.embeddings(face)


@ExceptionHandler
def get_cropped_face(img, cropper):
    print('Cropping the face...')
    result = cropper.predict(img)
    result = result[0]
    boxes = result.boxes
    
    max_area = 0
    largest_face = None
    
    for box in boxes:
        confidence = box.conf[0]
        if confidence >= CONF_THRESHOLD:
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = round(x1.item()), round(y1.item()), round(x2.item()), round(y2.item())
            # Ensure coordinates are within image bounds
            h, w = 160, 160  # Assuming fixed image dimensions (modify as needed)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            # Calculate the area of the bounding box
            area = (x2 - x1) * (y2 - y1)
            # If this face has a larger area than the previous largest, store it
            if area > max_area:
                max_area = area
                largest_face = img[y1:y2, x1:x2]
    # Return the face with the largest area (or None if no face was found)
    return largest_face if largest_face is not None else None
    
@ExceptionHandler
def detect_face(img,embedder=embedder,cropper=cropper):
    print('Recognizing started...')
    img = cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
    img = cv2.resize(img,(160,160))
    face = get_cropped_face(img,cropper)
    embeddings = get_embeddings(face,embedder)
    print(embeddings.shape)
    pred = model.predict(embeddings)
    print(encoder_classes[pred])
    return encoder_classes[pred]
    