from flask import request, session
from flask_socketio import emit
from __main__ import socketio
from datetime import datetime
from google.cloud import vision
import base64
import os
import sys

parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models
from app import db

client = vision.ImageAnnotatorClient()

@socketio.on('videoFrame')
def handle_emotion_from_frame(frame):
  header, data = frame.split(',', 1)
  imageData = base64.b64decode(data)

  visImg = vision.Image(content=imageData)

  response = client.face_detection(image=visImg)
  likelihood_name = ('UNKNOWN', 'VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE',
                       'LIKELY', 'VERY_LIKELY')

  for face in response.face_annotations:
        print('anger: {}'.format(likelihood_name[face.anger_likelihood]))
        print('joy: {}'.format(likelihood_name[face.joy_likelihood]))
        print('surprise: {}'.format(likelihood_name[face.surprise_likelihood]))
        print('sorrow: {} \n'.format(likelihood_name[face.sorrow_likelihood])) 
