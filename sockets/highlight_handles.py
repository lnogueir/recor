from flask import request, session
from flask_socketio import emit
from __main__ import socketio
from datetime import datetime
import os, sys

parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models
from app import db

@socketio.on('videoEmotions')
def handle_emotions(emotion):
  print(emotion)
  participantId = session.get('participantId', None)
  roomId = session.get('roomId', None)
  r = models.HighlightsMessage(emotion, participantId, roomId, datetime.now(),None)
  db.session.add(r)
  db.session.commit()
  pass


