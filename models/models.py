from app import db
from flask_sqlalchemy import SQLAlchemy

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    def __init__(self, id, createdAt):
        self.id = id
        self.created_at = createdAt

class Participant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    room_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    def __init__(self, name, roomId, createdAt):
        self.name = name
        self.room_id = roomId
        self.created_at = createdAt

class TranscriptionMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transcription = db.Column(db.String)
    participant_id = db.Column(db.Integer)
    room_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    def __init__(self, transcription, participantId, roomId, createdAt):
        self.transcription = transcription
        self.participant_id = participantId
        self.room_id = roomId
        self.created_at = createdAt
        