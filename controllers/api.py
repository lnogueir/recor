from flask import Blueprint, jsonify

api = Blueprint('api', __name__)

@api.route('/api/createRoom')
def create_room():
  return jsonify({'redirectUrl': '/test'}), 200