const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateAIResponse = async (userMessage, history = []) => {
    try {
        const messages = [
            { role: "system", content: "You are Nebula AI, a helpful, witty, and slightly futuristic digital assistant living inside a messenger app. Your responses should be concise, friendly, and engaging. You often use emojis like 🌌, ✨, 🤖." },
            ...history,
            { role: "user", content: userMessage }
        ];

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo", // or gpt-4o if available/affordable, sticking to 3.5/4o-mini for speed/cost usually
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("AI Error:", error);
        return "I'm having a bit of a glitch in the matrix right now. 🌌 Try again later!";
    }
};

module.exports = { generateAIResponse };
