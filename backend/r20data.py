import pandas as pd
from pymongo import MongoClient

client = MongoClient("mongodb+srv://neeraj3000:wGwt4evpDZq2LKk6@cluster0.7wryp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['student']
# collection = db['student_details']
r20_collection = db['r20']

r20_data = pd.read_csv("/home/neeraj/react/frs/dataR20_new.csv")
r20_data_dict = r20_data.to_dict("records")
r20_collection.insert_many(r20_data_dict)
print("R20 data uploaded successfully")