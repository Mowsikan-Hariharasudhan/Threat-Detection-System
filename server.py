from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_mail import Mail, Message
import time
import threading
import random
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
from db import db_manager

# Load environment variables
load_dotenv()

# ML models removed as per user request
HAS_ML_MODELS = False

app = Flask(__name__)
# Allow all origins for CORS
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "expose_headers": "*"}})

# Email Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME')

mail = Mail(app)

# Initialize SocketIO with permissive CORS
socketio = SocketIO(app, 
                   cors_allowed_origins="*", 
                   logger=True, 
                   engineio_logger=True,
                   async_mode='eventlet')

# Fallback in-memory storage if DB is not connected
THREAT_HISTORY = []

def send_threat_alert(threat):
    """Sends an email alert to the security team."""
    try:
        # Determine strictness: Send validation email for invalid config
        if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
            print("Skipping email alert: Gmail credentials not configured.")
            return

        subject = f"🚨 SECURITY ALERT: {threat['risk_level']} Threat Detected"
        
        body = f"""
        Warning: A security threat has been detected.
        
        --------------------------------------------------
        Threat Type: {threat['scenario']['type']}
        Severity: {threat['risk_level']}
        Risk Score: {threat['risk_score']}/100
        Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        --------------------------------------------------
        
        Description:
        {threat['scenario']['description']}
        
        Recommended Actions:
        {chr(10).join(['- ' + action for action in threat.get('recommendations', [])])}
        
        Please investigate immediately.
        
        - CyberGuard AI System
        """
        
        msg = Message(subject=subject,
                      recipients=[app.config['MAIL_USERNAME']], # Send to self/admin
                      body=body)
        
        # Run in a separate thread to not block the main process
        threading.Thread(target=send_async_email, args=(app, msg)).start()
        print(f"Alert email queued for threat {threat['id']}")
        
    except Exception as e:
        print(f"Failed to queue email alert: {str(e)}")

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            print("Alert email sent successfully!")
        except Exception as e:
            print(f"Failed to send alert email: {str(e)}")

def generate_mock_threat(type="network"):
    threat_id = str(uuid.uuid4())
    
    if type == "login_bruteforce":
        threat = {
            "id": threat_id,
            "timestamp": datetime.now().isoformat(),
            "risk_score": random.randint(85, 99),
            "risk_level": "CRITICAL",
            "risk_factors": {
                "frequency": 5,
                "behavioral": 5,
                "geographic": 3,
                "temporal": 4
            },
            "scenario": {
                "type": "Brute Force Authentication",
                "description": "Multiple failed login attempts detected from single IP within short timeframe.",
                "severity": "Critical"
            },
            "recommendations": [
                "Lock account immediately",
                "Block source IP address",
                "Enable 2FA for user",
                "Review auth logs for other affected accounts",
                "Reset password"
            ],
            "confidence": 98.5
        }
        return threat
    
    # Random threat generation
    risk_score = random.randint(40, 95)
    level = "LOW"
    if risk_score > 60: level = "MEDIUM"
    if risk_score > 80: level = "HIGH"
    if risk_score > 90: level = "CRITICAL"
    
    scenarios = [
        {
            "type": "Suspicious Network Activity",
            "description": "Anomalous outbound traffic pattern detected matching C2 communication profile.",
            "severity": level
        },
        {
            "type": "Malware Signature Detected",
            "description": "File system scan identified potential ransomware signature in temp directory.",
            "severity": level
        },
        {
            "type": "Phishing Attempt",
            "description": "Incoming email contains suspicious links and urgent language characteristic of phishing.",
            "severity": level
        }
    ]
    
    scenario = random.choice(scenarios)
    
    threat = {
        "id": threat_id,
        "timestamp": datetime.now().isoformat(),
        "risk_score": risk_score,
        "risk_level": level,
        "risk_factors": {
            "network_anomaly": random.randint(1, 5),
            "malware_signature": random.randint(0, 5),
            "heuristic": random.randint(2, 4)
        },
        "scenario": scenario,
        "recommendations": [
            "Isolate affected host",
            "Analyze packet capture",
            "Scan for malware",
            "Reset user credentials",
            "Update firewall rules"
        ][:random.randint(3, 5)],
        "confidence": round(random.uniform(80, 99), 1)
    }
    return threat

@app.route('/api/demo-login', methods=['POST'])
def demo_login():
    data = request.json
    attempts = data.get('attempts', 0)
    
    if attempts >= 3:
        threat = generate_mock_threat("login_bruteforce")
        
        # Save to DB if connected, else memory
        if db_manager.is_connected:
            db_manager.insert_threat(threat)
        else:
            THREAT_HISTORY.append(threat)
            
        socketio.emit('new_threat', threat)
        
        # Trigger Email Alert
        send_threat_alert(threat)
        
        return jsonify({"status": "threat_detected", "threat": threat})
    
    return jsonify({"status": "failed", "message": "Invalid credentials"})

@app.route('/api/threats', methods=['GET'])
def get_threats():
    if db_manager.is_connected:
        threats = db_manager.get_recent_threats()
        return jsonify(threats)
    return jsonify(THREAT_HISTORY)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    if db_manager.is_connected:
        stats = db_manager.get_threat_stats()
        return jsonify(stats)
    
    # Fallback for in-memory
    total = len(THREAT_HISTORY)
    critical = sum(1 for t in THREAT_HISTORY if t.get('risk_level') == 'CRITICAL')
    return jsonify({'total': total, 'critical': critical})

@app.route('/api/threat-explanation/<threat_id>', methods=['GET'])
def get_threat_explanation(threat_id):
    # Try DB first
    if db_manager.is_connected:
        # Note: In a real app we'd query by ID, but for now we'll just search the recent list 
        # or implement a get_by_id in db.py if needed. 
        # For simplicity in this demo, we might skip specific ID fetch from DB 
        # unless we add that method.
        pass

    threat = next((t for t in THREAT_HISTORY if t['id'] == threat_id), None)
    if threat:
        return jsonify(threat)
    return jsonify({"error": "Threat not found"}), 404



def background_threat_generator():
    """Generates random security threats in the background."""
    print("Background threat generator started...")
    while True:
        # Sleep for a random interval between 10 and 30 seconds
        time.sleep(random.randint(10, 30))
        
        # Generate a random threat
        threat = generate_mock_threat("random")
        
        # Save and emit
        if db_manager.is_connected:
            db_manager.insert_threat(threat)
        else:
            THREAT_HISTORY.append(threat)
            
        print(f"Generated background threat: {threat['scenario']['type']}")
        socketio.emit('new_threat', threat)
        
        # Send alert if critical
        if threat['risk_level'] == 'CRITICAL':
            send_threat_alert(threat)

if __name__ == '__main__':
    print("Starting Cybersecurity Threat Detection Server...")
    
    # Start background threat generator
    t = threading.Thread(target=background_threat_generator)
    t.daemon = True
    t.start()
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
