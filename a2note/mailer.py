"""
Script to send email from the official a2note.ninja email address.

Project: a2note.ninja

Author: Ama
"""

import smtplib
from email.mime.text import MIMEText

import os

def send_email(recipient, subject, content):
    EMAIL_ACCOUNT = os.environ["A2NOTE_EMAIL_ADDRESS"]
    EMAIL_PASSWORD = os.environ["A2NOTE_EMAIL_PSW"]

    PORT = 465
    server = smtplib.SMTP_SSL("smtp.gmail.com", PORT)

    #Login
    server.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)

    #Message
    msg = MIMEText(content, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = EMAIL_ACCOUNT
    msg["To"] = recipient

    server.sendmail(EMAIL_ACCOUNT, [recipient, ], msg.as_string())
