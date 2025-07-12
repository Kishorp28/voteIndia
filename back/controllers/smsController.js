// Use environment variables for Twilio credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
  try {
    const twilio = await import('twilio');
    twilioClient = twilio.default(
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN
    );
  } catch (err) {
    console.warn('Twilio module not installed. Falling back to mock SMS.');
    twilioClient = null;
  }
}

export async function sendSMS(req, res) {
  const { mobile, voterId } = req.body;
  
  if (!mobile || !voterId) {
    return res.status(400).json({ error: 'Missing mobile or voterId' });
  }

  if (twilioClient) {
    // Send real SMS using Twilio
    try {
      const message = await twilioClient.messages.create({
        body: `Your Voter ID is: ${voterId}. Please keep this safe for voting.`,
        from: TWILIO_PHONE_NUMBER,
        to: `+91${mobile}` // Assumes Indian numbers; adjust as needed
      });
      res.json({
        success: true,
        method: 'twilio',
        message: 'SMS sent successfully via Twilio',
        sid: message.sid,
        voterId: voterId,
        mobile: mobile
      });
    } catch (err) {
      console.error('Twilio SMS error:', err);
      res.status(500).json({
        error: 'Failed to send SMS via Twilio',
        details: err.message
      });
    }
  } else {
    // Mock SMS for development (no Twilio required)
    console.log(`[MOCK SMS] Voter ID ${voterId} would be sent to +91${mobile}`);
    console.log(`[MOCK SMS] Message: "Your Voter ID is: ${voterId}. Please keep this safe for voting."`);
    // Simulate SMS delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    res.json({
      success: true,
      method: 'mock',
      message: 'SMS simulated successfully (Twilio not configured)',
      voterId: voterId,
      mobile: mobile,
      note: 'This is a development environment. In production, this would send a real SMS via Twilio.'
    });
  }
} 