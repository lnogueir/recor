from flask import Blueprint, jsonify
from app import db
import datetime
from database.models import Room

api = Blueprint('api', __name__)

@api.route('/api/createRoom')
def create_room():
  r = Room(1212, datetime.datetime.now())
  db.session.add(r)
  test = db.session.commit()
  return jsonify({'redirectUrl': '/test'}), 200