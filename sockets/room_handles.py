from flask import request, session
from flask_socketio import emit, join_room, leave_room
from __main__ import socketio

import os
import sys
parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models
from app import db
from google.cloud import vision
import base64
import jsonify
from datetime import datetime
import cv2
import numpy as np
# import tensorflow as tf
# from tensorflow import keras


#OPEN CV 
haar_cascade=cv2.CascadeClassifier('haar_face.xml')
# model = keras.models.load_model('weights.h5')

@socketio.on('connect')
def connect_handler():
  participantName = request.args.get('participantName')
  if 'participantName' not in session or session['participantName'] != participantName:
    session['participantName'] = participantName
    r = models.Participant(participantName, session.get('roomId', None), datetime.now())
    db.session.add(r)
    db.session.commit()
    session['participantId'] = r.id
  join_room(session['roomId'])

@socketio.on('emotion')
def emotion_handler(url):
  try:
        content = url
  except:
      return jsonify({'status':0 ,'error': 'Request data invalid'}), 400

  try:
    encoded_image = str(content)
    header, data = encoded_image.split(',', 1)
    image_data = base64.b64decode(data)
    
    #   OPEN CV CODE   #
    np_array = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_UNCHANGED)

    faces_rect = haar_cascade.detectMultiScale(image, scaleFactor=1.1, minNeighbors = 3)
    rect_list = []

    for (x,y,w,h) in faces_rect:
        # cv2.rectangle(image, (x,y-20), (x+w,y+h+10),(0,255,0),2)
        # cv2.imwrite('test.jpeg',image[y-80:y+h+40, x-80:x+w+40])
        cropImg = image[y-40:y+h+40, x-40:x+w+40]
        rect_list = [x-40,y-40,x+w+40,y+h+40]

    d_size = (48,48)
    success, encoded_image = cv2.imencode('.jpeg', cropImg)
    res_img = cv2.resize(cropImg,d_size)
    gray = cv2.cvtColor(res_img, cv2.COLOR_BGR2GRAY)
    # img = res_img.reshape(1,197,197,3)
    # pred = model.predict(gray[np.newaxis, :, :,np.newaxis])
    # emotions = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise', 'Neutral']

    # pred_emotion = emotions[pred.argmax()]
    # print(pred_emotion)
  except :
    print('Erro')
  return 1    

  
