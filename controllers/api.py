from flask import Blueprint, jsonify, request, session
from app import db
from datetime import datetime
import os
import sys

parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)
from models import models

api = Blueprint('api', __name__)

@api.route('/api/createRoom', methods=['POST'])
def create_room():
  req_data = request.get_json(force=True)
  roomId = req_data['roomId']
  r = models.Room(roomId, datetime.now())
  db.session.add(r)
  db.session.commit()
  return jsonify(success=True), 200