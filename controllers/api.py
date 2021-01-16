from flask import Blueprint, jsonify
from app import db
import datetime
from database.models import Room
from flask import Blueprint, jsonify, request

api = Blueprint('api', __name__)

@api.route('/api/createRoom', methods=['POST'])
def create_room():
  r = Room(1212, datetime.datetime.now())
  db.session.add(r)
  test = db.session.commit()
  print(request.data['roomId'])
  return jsonify({'redirectUrl': '/test'}), 200