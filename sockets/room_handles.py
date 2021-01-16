from flask import request, session
from flask_socketio import emit, join_room, leave_room
from __main__ import socketio

@socketio.on('connect')
def connect_handler():
  print(request.args)
