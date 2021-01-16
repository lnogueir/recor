from flask import Blueprint, jsonify, request, session
from app import db
from datetime import datetime
import os
import sys
from google.cloud import storage


parent_dir_name = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.append(parent_dir_name)

from models import models

#CLOUD STORAGE
CLOUD_STORAGE_BUCKET = os.environ['CLOUD_STORAGE_BUCKET']

api = Blueprint('api', __name__)

@api.route('/api/createRoom', methods=['POST'])
def create_room():
  req_data = request.get_json(force=True)
  roomId = req_data['roomId']
  r = models.Room(roomId, datetime.now())
  db.session.add(r)
  db.session.commit()
  return jsonify(success=True), 200


@api.route('/api/test', methods=['GET'])
def test():
  gcs = storage.Client()
  bucket = gcs.get_bucket(CLOUD_STORAGE_BUCKET)
  print(CLOUD_STORAGE_BUCKET)
  blob = bucket.blob('text.txt')
  f = open(r"C:\Users\Jawad Bhimani\Desktop\recor\controllers\text.txt", "r")
  blob.upload_from_string(
        f.read(),
        content_type='txt'
  )
  blob.make_public()
  print(blob.public_url)

  return jsonify(success=True), 200




