from flask import Blueprint, jsonify, request

api = Blueprint('api', __name__)

@api.route('/api/createRoom', methods=['POST'])
def create_room():
  print(request.data['roomId'])
  return jsonify({'redirectUrl': '/test'}), 200