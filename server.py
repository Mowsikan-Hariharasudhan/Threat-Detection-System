from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import threading
import random
import uuid
from datetime import datetime
import os
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

# Email Configuration
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

EMAIL_SENDER = os.getenv('EMAIL_USER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASS')
EMAIL_RECEIVER = os.getenv('EMAIL_RECEIVER', EMAIL_SENDER) # Default to self if not set

def send_alert_email(threat):
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        print("Skipping email alert: Credentials not found.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = EMAIL_RECEIVER
        msg['Subject'] = f"🚨 Security Alert: {threat.get('scenario', {}).get('type', 'Unknown Threat')}"

        body = f"""
        CYBERGUARD SECURITY ALERT
        =========================
        
        Risk Level: {threat.get('risk_level')}
        Risk Score: {threat.get('risk_score')}/100
        Timestamp: {threat.get('timestamp')}
        
        Threat Type: {threat.get('scenario', {}).get('type')}
        Description: {threat.get('scenario', {}).get('description')}
        
        Recommended Actions:
        {chr(10).join(['- ' + r for r in threat.get('recommendations', [])])}
        
        --
        This is an automated message from your Threat Detection System.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, text)
        server.quit()
        print(f"Alert email sent to {EMAIL_RECEIVER}")
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.route('/api/demo-login', methods=['POST'])
def demo_login():
    data = request.json
    attempts = data.get('attempts', 0)
    
    if attempts >= 3:
        threat = generate_mock_threat("login_bruteforce")
        
        # --- Automated Response System (>90% Score) ---
        response_actions = []
        if threat['risk_score'] > 90:
            print(f"CRITICAL THREAT DETECTED (Score: {threat['risk_score']}). Initiating automated response...")
            
            # Action 1: Block IP (Simulation)
            threat['mitigation_status'] = "Active"
            response_actions.append("BLOCK_IP_ADDRESS")
            
            # Action 2: Revoke Session (Simulation)
            response_actions.append("REVOKE_SESSION")
            
            # Action 3: Force Password Reset (Simulation)
            response_actions.append("FORCE_PASSWORD_RESET")
            
            # Append actions to threat data for frontend display
            threat['automated_actions'] = response_actions
            
        # Send Email Alert (For ALL threats as requested)
        # Run in background thread to not block response
        threading.Thread(target=send_alert_email, args=(threat,)).start()

        # Save to DB if connected, else memory
        if db_manager.is_connected:
            db_manager.insert_threat(threat)
        else:
            THREAT_HISTORY.append(threat)
            
        socketio.emit('new_threat', threat)
        return jsonify({
            "status": "threat_detected", 
            "threat": threat,
            "automated_responses": response_actions if threat['risk_score'] > 90 else []
        })
    
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
