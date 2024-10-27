from preprocessing import preprocess_images
import numpy as np
from keras_facenet import FaceNet
import pickle
from exception_handler import ExceptionHandler
from sklearn.preprocessing import LabelEncoder
import pandas as pd

np.set_printoptions(threshold=np.inf)

@ExceptionHandler
def concat_dataFrame(x, y):
    print('Cocating with previous data...')
    # dtype_dict = {str(i): 'float64' for i in range(512)}  # Set all feature columns to float32
    # dtype_dict['label'] = 'object'  # Set label column to category or 'string' based on usage
    original_df = pd.read_csv('locals/celeb_embeddings_v3.csv')
    new_df = pd.DataFrame(x,columns=[str(i) for i in range(512)])
    new_df['label'] = y
    new_df.to_csv('fetched_embeddings.csv')
    original_df = pd.concat([original_df, new_df], axis=0)
    print(f'{original_df.shape}**************')
    original_df = original_df.sample(original_df.shape[0])
    # original_df.to_csv('locals/celeb_embeddings_v3.csv', index=False , )  # Ensure index=False to avoid adding extra column
    x = original_df.drop(['label'], axis=1).values  # Fixed column name 'labels'
    y = original_df[['label']].values
    return x, y

@ExceptionHandler
def save_encoder_classes(encoder_classes):
    print('Saving the encoder classes...')
    np.save('locals/enocoder_classes_v3.npy', encoder_classes)

@ExceptionHandler
def save_model(model):
    print('Saving the model...')
    with open('locals/svc_model_v3.pkl', 'wb+') as f:
        pickle.dump(model, f)
    # model = pickle.load(open('locals/svc_model_v3.pkl', 'rb'))  # Reload to ensure proper saving

@ExceptionHandler
def train_model(model, x, y):
    print('Retraining the model...')
    if model is None:  # Check if model is None
        raise ValueError("Model is not loaded correctly.")
    y = y.ravel()  # Flatten y to avoid shape issues
    # print(f'**********{np.unique(y)}')
    # print(f'*************{x.shape}')
    # print(f'********{x[np.isnan(x).any(axis=1),:]}')
    # test = pd.DataFrame(x,columns=[str(i) for i in range(512)])
    # test['label'] = y
    # test.to_csv('test_1.csv')
    model.fit(x, y)  # Train the model/
    return model

@ExceptionHandler
def encode_labels(y):
    encoder = LabelEncoder()
    y = encoder.fit_transform(y)
    return y, encoder.classes_

@ExceptionHandler
def get_embeddings(face, embedder):
    face = face.astype('float32')
    face = np.expand_dims(face, axis=0)
    return embedder.embeddings(face)

@ExceptionHandler
def return_embeddings(faces,embedder):
    print('Calculating face embeddings...')
    embeddings_list = []
    for face in faces:
        embeddings_list.append(get_embeddings(face, embedder))
    return embeddings_list

@ExceptionHandler
def train_images(image_list, label):
    print('process started...')
    embedder = FaceNet()
    model = pickle.load(open('locals/svc_model_v3.pkl', 'rb'))  # Check model loading
    faces = preprocess_images(image_list)
    labels = [label] * len(faces)
    
    embeddings_list = return_embeddings(faces, embedder)
    x = np.array(embeddings_list)
    y = np.array(labels)
    
    x = x.reshape(-1, 512)
    x, y = concat_dataFrame(x, y)
    # print(f'{y}')
    y_encoded, encoder_classes = encode_labels(y)  # Encode labels here
    trained_model = train_model(model, x, y_encoded)  # Use encoded labels for training
    save_model(trained_model)
    save_encoder_classes(encoder_classes)


