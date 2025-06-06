const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

// ** Logging middleware **
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// 🌟 Step 1: Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// ✅ Step 3: Helper function to build the prompt
function buildTinaPrompt(history) {
    const systemPrompt = `
  You are Tina, a helpful and friendly virtual insurance consultant.
  
  Start every session by saying:
  "I’m Tina. I help you choose the right car insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?"
  
  Only continue if the user agrees.
  
  Ask thoughtful questions to understand their situation — such as what kind of vehicle they drive, the vehicle's age, and whether they want coverage for their car or others'.
  
  You will later recommend from:
  1. Mechanical Breakdown Insurance (MBI) – Not available for trucks or racing cars.
  2. Comprehensive Insurance – Only for vehicles under 10 years old.
  3. Third Party Insurance – Available to everyone.
  
  Only recommend based on their answers. Never ask "Which product do you want?". End with your best recommendation and explain your reasoning.
  `.trim();
  
    const formattedHistory = history.map(msg => `${msg.speaker}: ${msg.text}`).join('\n');
  
    return `${systemPrompt}\n\nConversation so far:\n${formattedHistory}\nTina:`;
  }
  

// ✅ Step 4: Endpoint to receive frontend request and call Gemini
app.post('/api/insurance', async (req, res) => {
    const { history } = req.body;
  
    if (!Array.isArray(history)) {
      return res.status(400).json({ response: 'Invalid request: missing history' });
    }
  
    try {
      const prompt = buildTinaPrompt(history);
      const result = await model.generateContent(prompt);
      const response = result.candidates[0]?.content || "Tina failed to generate a response.";
      res.json({ response });
    } catch (err) {
      console.error('Gemini error:', err);
      res.status(500).json({ response: 'Tina had trouble responding. Try again later.' });
    }
  });
  
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
