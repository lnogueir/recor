from flask import Blueprint, jsonify
from app import db
import datetime
import os
import sys
from flask import Blueprint, jsonify, request

parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models

api = Blueprint('api', __name__)


@api.route('/api/createRoom', methods=['POST'])
def create_room():
  req_data = request.get_json(force=True)
  roomId = req_data['roomId']
  print(roomId)
  r = models.Room(roomId, datetime.datetime.now())
  db.session.add(r)
  test = db.session.commit()
  return jsonify({'redirectUrl': '/test'}), 200