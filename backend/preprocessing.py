import numpy as np
import os
import cv2
from ultralytics import YOLO
import tensorflow
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from exception_handler import ExceptionHandler

# Initialize YOLO model
cropper = YOLO('locals/neeraj_yolo.pt')

# Define the ImageDataGenerator with augmentations
datagen = ImageDataGenerator(
    rotation_range=15,
    width_shift_range=0.32,
    height_shift_range=0.32,
    shear_range=0.25,
    fill_mode='nearest',
)

# Function to crop faces
@ExceptionHandler
def crop_faces(images):
    def return_crop_face(img, cropper):
        # Predict using the YOLO model
        results = cropper.predict(img,verbose=False)
        result = results[0]
        # Check if any boxes are detected
        if len(result.boxes) == 0:
            print("No face detected")
            return None  # Or you could return the original image or a placeholder
        # Extract bounding box information for the first detected object
        box = result.boxes
        confidence = box.conf[0]
        # Set a confidence threshold if needed (optional)
        if confidence < 0.5:  # Set this value according to your needs
            print("Low confidence detection")
            return None
        # Get bounding box coordinates
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = round(x1.item()), round(y1.item()), round(x2.item()), round(y2.item())
        # Ensure the coordinates are within the image bounds
        h, w, ch = img.shape
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        # Crop the face region from the image
        face = img[y1:y2, x1:x2]
        return face
    faces = []
    for img in images:
        face = return_crop_face(img, cropper)
        if face is not None:  # Only append valid faces
            face = cv2.cvtColor(face, cv2.COLOR_RGB2BGR)
            faces.append(face)
        else:
            # print("No valid face detected in this image")
            pass

    return faces


# Function to augment images
@ExceptionHandler
def augment_images(image_list, augment_count=1):
    augmented_images = []
    for image in image_list:
        augmented_images.append(image)
        image = np.expand_dims(image, 0)
        for _ in range(augment_count):
            aug_iter = datagen.flow(image, batch_size=1)
            augmented_img = next(aug_iter)[0].astype(np.uint8)
            augmented_images.append(augmented_img)
    return augmented_images

# Main image processing function
@ExceptionHandler
def preprocess_images(images):
    print(f'Images Captured : {len(images)}')
    faces = crop_faces(images)
    print(f'Faces Found : {len(faces)}')
    augmented_faces = augment_images(faces, augment_count=1)
    print(f'Images Augmented : {len(augmented_faces)}')
    # if not os.path.exists('captured_images'):
    #     os.makedirs('captured_images')
    # for idx, face in enumerate(augmented_faces):
    #     try:
    #         print(f'Saving image {idx}')
    #         cv2.imwrite(f'captured_images/img_{idx}.jpg', face)
    #     except Exception as e:
    #         print(f"Error saving image {idx}: {e}")
    return augmented_faces
SAVE_DIR = "captured_images"
os.makedirs(SAVE_DIR, exist_ok=True)
