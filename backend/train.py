from preprocessing import preprocess_images
import numpy as np
from keras_facenet import FaceNet
import pickle
from exception_handler import ExceptionHandler
from sklearn.preprocessing import LabelEncoder

embedder = FaceNet()
model = pickle.load(open('locals/svc_model_v3.pkl','rb'))

@ExceptionHandler
def save_encoder_classes(encoder_classes):
    np.save('locals/enocoder_classes_v3.npy',encoder_classes)

@ExceptionHandler
def save_model(model):
    with open('locals/svc_model_v3.pkl','wb+') as f:
        pickle.dump(model,f)


@ExceptionHandler
def train_model(model,x,y):
    model.partial_fit(x,y)
    return model

@ExceptionHandler
def encode_labels(y):
    encoder = LabelEncoder()
    y = encoder.fit_transform(y)
    return y,encoder.classes_

@ExceptionHandler
def get_embeddings(face , embedder):
    face = face.astype('float32')
    face = np.expand_dims(face,axis=0)
    return embedder.embeddings(face)

@ExceptionHandler
def return_embeddings(faces):
    embeddings_list = []
    for face in faces:
        embeddings_list.append(get_embeddings(face,embedder))
    return embeddings_list
        
@ExceptionHandler
def train_images(image_list,label):
    faces = preprocess_images(image_list)
    labels = [label]*len(faces)
    embeddings_list = return_embeddings(faces)
    x = np.array(embeddings_list)
    y = np.array(labels)
    x = x.reshape(-1,512)
    y,enocder_classes = encode_labels(y)
    trained_model = train_model(model,x,y)
    save_model(trained_model)
    save_encoder_classes(enocder_classes)