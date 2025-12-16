import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.threats_collection = None
        self.mongo_uri = os.getenv('MONGO_URI')
        self.is_connected = False
        
        if self.mongo_uri:
            self.connect()
        else:
            print("Warning: MONGO_URI not found in environment variables. Running in memory-only mode.")

    def connect(self):
        try:
            print(f"Attempting to connect to MongoDB...")
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            # Trigger a connection check
            self.client.admin.command('ping')
            self.db = self.client.get_database('cybersecurity_db')
            self.threats_collection = self.db.threats
            self.is_connected = True
            print("Successfully connected to MongoDB Atlas!")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            print("Falling back to in-memory storage.")
            self.is_connected = False

    def insert_threat(self, threat_data):
        if self.is_connected and self.threats_collection is not None:
            try:
                # Create a copy for DB insertion to avoid polluting the object with non-serializable types
                db_record = threat_data.copy()
                if 'created_at' not in db_record:
                    db_record['created_at'] = datetime.utcnow()
                
                result = self.threats_collection.insert_one(db_record)
                
                # Update the original dict with the ID string for the frontend
                threat_data['_id'] = str(result.inserted_id)
                return True
            except Exception as e:
                print(f"Error inserting threat to DB: {e}")
                return False
        return False

    def get_recent_threats(self, limit=50):
        if self.is_connected and self.threats_collection is not None:
            try:
                threats = list(self.threats_collection.find().sort('timestamp', -1).limit(limit))
                # Convert ObjectId and datetime to string
                for threat in threats:
                    threat['_id'] = str(threat['_id'])
                    if 'created_at' in threat and isinstance(threat['created_at'], datetime):
                        threat['created_at'] = threat['created_at'].isoformat()
                return threats
            except Exception as e:
                print(f"Error fetching threats from DB: {e}")
                return []
        return []

    def get_threat_stats(self):
        if self.is_connected and self.threats_collection is not None:
            try:
                total = self.threats_collection.count_documents({})
                critical = self.threats_collection.count_documents({'risk_level': 'CRITICAL'})
                return {'total': total, 'critical': critical}
            except Exception as e:
                print(f"Error fetching stats from DB: {e}")
                return {'total': 0, 'critical': 0}
        return {'total': 0, 'critical': 0}

# Singleton instance
db_manager = DatabaseManager()
