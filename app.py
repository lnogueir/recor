from flask import Flask
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
import os

server = Flask(
    __name__, 
    static_url_path='', 
    static_folder='client/static', 
    template_folder='client/templates'
)

server.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('COCKROACH_DB_URL')

db = SQLAlchemy(server)

socketio = SocketIO(server, binary=True)

if __name__ == '__main__':
    server.secret_key = 'super secret key'
    server.config['SESSION_TYPE'] = 'filesystem'

    
    from sockets import room_handles
    from sockets import highlight_handles

    from controllers.api import api
    from controllers.routes import routes

    server.register_blueprint(api)
    server.register_blueprint(routes)

    socketio.run(server, debug=True)