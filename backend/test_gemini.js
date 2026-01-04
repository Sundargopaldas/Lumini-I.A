const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // For newer versions of the SDK, we might need to use a different way to list models
    // But let's try the standard way first if available, or just try to generate with a few models.
    console.log("Testing models with API Key:", apiKey ? "Present" : "Missing");

    // List models using REST API
    try {
        console.log("Fetching available models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models returned or error:", data);
        }
    } catch (e) {
        console.error("Error listing models:", e.message);
    }

    /*
    const modelsToTest = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-flash-latest"]; 
    
    for (const modelName of modelsToTest) {
      // ...
    }
    */

  } catch (error) {
    console.error("Global Error:", error);
  }
}

listModels();
