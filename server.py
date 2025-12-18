from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import threading
import random
import uuid
from datetime import datetime
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from db import db_manager

# ML models removed as per user request
HAS_ML_MODELS = False

app = Flask(__name__)
# Allow all origins for CORS
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "expose_headers": "*"}})

# Initialize SocketIO with permissive CORS
socketio = SocketIO(app, 
                   cors_allowed_origins="*", 
                   logger=True, 
                   engineio_logger=True,
                   async_mode='eventlet')

# Fallback in-memory storage if DB is not connected
THREAT_HISTORY = []

def send_email_alert(threat_data):
    """
    Sends an email alert for a detected threat.
    Runs in a separate thread to avoid blocking the main execution.
    """
    def _send_email_thread(threat):
        smtp_server = "smtp.gmail.com"
        port = 587  # For starttls
        sender_email = os.environ.get("MAIL_USERNAME")
        password = os.environ.get("MAIL_PASSWORD")
        receiver_email = os.environ.get("MAIL_RECIPIENT", sender_email) # Default to self if not set

        if not sender_email or not password:
            print("Email credentials not set. Skipping email alert.")
            return

        message = MIMEMultipart("alternative")
        message["Subject"] = f"🚨 ALERT: {threat.get('risk_level', 'UNKNOWN')} Threat Detected - {threat.get('scenario', {}).get('type', 'Unknown')}"
        message["From"] = sender_email
        message["To"] = receiver_email

        # Create the HTML version of your message
        html = f"""\
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                <h2 style="color: #dc3545;">Security Incident Detected</h2>
                <p><strong>System Time:</strong> {threat.get('timestamp')}</p>
                <hr>
                
                <h3 style="color: #0f172a;">Threat Details</h3>
                <p><strong>Type:</strong> {threat.get('scenario', {}).get('type')}</p>
                <p><strong>Severity:</strong> <span style="font-weight: bold; color: {
                    '#dc3545' if threat.get('risk_level') in ['CRITICAL', 'HIGH'] else '#ffc107'
                }">{threat.get('risk_level')}</span></p>
                <p><strong>Risk Score:</strong> {threat.get('risk_score')}/100</p>
                
                <div style="background-color: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
                    <strong>Description:</strong><br>
                    {threat.get('scenario', {}).get('description')}
                </div>
                
                <h4>Recommended Actions:</h4>
                <ul>
                    {''.join(f'<li>{rec}</li>' for rec in threat.get('recommendations', []))}
                </ul>
                
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                    This is an automated alert from your AI-Powered Threat Detection System. 
                    Please do not reply to this email.
                </p>
            </div>
          </body>
        </html>
        """

        part = MIMEText(html, "html")
        message.attach(part)

        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(smtp_server, port) as server:
                server.ehlo()  # Can be omitted
                server.starttls(context=context)
                server.ehlo()  # Can be omitted
                server.login(sender_email, password)
                server.sendmail(sender_email, receiver_email, message.as_string())
            print(f"Email alert sent successfully to {receiver_email}")
        except Exception as e:
            print(f"Failed to send email alert: {e}")

    # Start email sending in background
    email_thread = threading.Thread(target=_send_email_thread, args=(threat_data,))
    email_thread.daemon = True
    email_thread.start()

def generate_mock_threat(type="network"):
    threat_id = str(uuid.uuid4())
    
    if type == "login_bruteforce":
        return {
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
    
    return {
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
            
        # Emit socket event
        socketio.emit('new_threat', threat)
        
        # Trigger Email Alert
        send_email_alert(threat)
        
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



if __name__ == '__main__':
    print("Starting Cybersecurity Threat Detection Server...")
    # Background threat generator disabled as per user request
    # t = threading.Thread(target=background_threat_generator)
    # t.daemon = True
    # t.start()
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
