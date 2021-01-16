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
  
@socketio.on('sendMessage')
def message_handler(message):
  print(message)
  print(session)
  r = models.ChatMessage(session.get('participantId',None), session.get('roomId', None), datetime.now(),'TEST_URL',message)
  db.session.add(r)
  db.session.commit()
  
  return 1

@socketio.on('transcription')
def transcription_handler(transcription):
  print(transcription)
