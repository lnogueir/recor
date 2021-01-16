from flask import request, session
from flask_socketio import emit, join_room, leave_room
from __main__ import socketio
from datetime import datetime
import os
import sys

parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models
from app import db
from google.cloud import storage
import base64

#CLOUD STORAGE
CLOUD_STORAGE_BUCKET = os.environ['CLOUD_STORAGE_BUCKET']

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
  
@socketio.on('chatMessage')
def message_handler(message, imageData,name): 
  if imageData :
    imageData = imageData.split(',')[1]
    decoded = base64.b64decode(imageData)

    filteredName, fileType = name.split('.')

    gcs = storage.Client()
    bucket = gcs.get_bucket(CLOUD_STORAGE_BUCKET)
    
    image_types = ['jpeg','png','gif']
    file_types = ['zip','pdf']
    if fileType in image_types:
      blob = bucket.blob(str(filteredName)+'.'+str(fileType))
      blob.upload_from_string(
            decoded,
            content_type='image/'+str(fileType)
      )
      blob.make_public()
      link = blob.public_url
      print(link)

    elif fileType in file_types:
      blob = bucket.blob(str(filteredName)+'.'+str(fileType))
      blob.upload_from_string(
            decoded,
            content_type='application/'+str(fileType)
      )
      blob.make_public()
      link = blob.public_url 

  else:
    link = None  
  
  participantId = session.get('participantId',None)
  roomId = session.get('roomId', None)
  r = models.ChatMessage(participantId, roomId, datetime.now(),link,message)
  db.session.add(r)
  db.session.commit()
  return

@socketio.on('transcriptionMessage')
def transcription_handler(transcription):
  participantId = session.get('participantId', None)
  roomId = session.get('roomId', None)
  r = models.TranscriptionMessage(transcription, participantId, roomId, datetime.now())
  db.session.add(r)
  db.session.commit()
