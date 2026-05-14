import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMMA_API_KEY);

async function testAI() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent("Say hello");
    const response = await result.response;

    console.log(response.text());
  } catch (err) {
    console.error("FULL ERROR:", err);
  }
}

testAI();
