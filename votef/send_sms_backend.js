require('dotenv').config();
// Simple Express backend for sending SMS with Twilio
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Use environment variables for Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Only create client if credentials are available
let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

app.post('/send-sms', async (req, res) => {
    const { mobile, voterId } = req.body;
    if (!mobile || !voterId) {
        return res.status(400).json({ error: 'Missing mobile or voterId' });
    }
    
    if (!client) {
        return res.status(500).json({ 
            error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.' 
        });
    }
    
    try {
        const message = await client.messages.create({
            body: `Your Voter ID is: ${voterId}`,
            from: twilioPhone,
            to: `+91${mobile}`
        });
        res.json({ success: true, sid: message.sid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Twilio SMS backend running on port ${PORT}`);
});

/*
Instructions:
1. Install dependencies: npm install express body-parser cors twilio
2. Start the server: node send_sms_backend.js
3. Update your frontend to POST to http://localhost:3001/send-sms with JSON { mobile, voterId }
*/ 

