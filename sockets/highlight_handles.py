from flask import request, session
from flask_socketio import emit
from __main__ import socketio
from datetime import datetime
import os, sys

parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models
from app import db

@socketio.on('emotions')
def handle_emotions(emotions):
  pass


