from flask import Blueprint, render_template, request, session

routes = Blueprint('routes', __name__)

@routes.route('/')
def home():
    return render_template('index.html')

@routes.route('/room/<roomId>')
def room(roomId):
  ## LATER CHECK IF ROOM EXISTS IN REDIS
  session['roomId'] = roomId
  return render_template('room.html', roomId=roomId)

  

