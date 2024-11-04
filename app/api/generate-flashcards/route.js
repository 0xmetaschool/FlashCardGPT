import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Accesing API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Creating an OpenAI assistant
async function getOrCreateAssistant() {
  try {
    const assistants = await openai.beta.assistants.list({
      limit: 1,
      order: 'desc'
    });

    const existingAssistant = assistants.data.find(
      (assistant) => assistant.name === 'Flashcard Generator'
    );


    return await openai.beta.assistants.create({
      name: 'Flashcard Generator',
      instructions: `You are a flashcard generation assistant. Your task is to analyze the provided content and generate flashcards.
      IMPORTANT: You must respond ONLY with a JSON array of flashcard objects. Each object must have exactly two fields:
      - "question": the flashcard question
      - "answer": the corresponding answer
      
      Example format:
      [
        {
          "question": "What is example question 1?",
          "answer": "This is example answer 1"
        },
        {
          "question": "What is example question 2?",
          "answer": "This is example answer 2"
        }
      ]
      
      Do not include any introductory text, explanations, or other content. Only output valid JSON in the exact format shown above.`,
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }]
    });
  } catch (error) {
    console.error('Error creating/getting assistant:', error);
    throw error;
  }
}

// Function to generate Flashcards based on 'vectorStoreId' and 'assistant id'
async function generateFlashcardsWithAssistant(vectorStoreId) {
  try {
    const assistant = await getOrCreateAssistant();
    // Update assistant with vector store
    await openai.beta.assistants.update(assistant.id, {
      tool_resources: { 
        file_search: { 
          vector_store_ids: [vectorStoreId] 
        } 
      }
    });
    
    // Creating threads
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Generate flashcards from the uploaded content. IMPORTANT: Respond ONLY with a JSON array of flashcard objects. Each object must have "question" and "answer" fields. Do not include any other text or explanations.`
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
      instructions: `Create flashcards from the content. REMEMBER: Your response must be ONLY a JSON array of objects with "question" and "answer" fields. No other text or content.`
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    const maxAttempts = 60;
    let attempts = 0;

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed: ' + runStatus.last_error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Assistant run timed out');
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

    if (!assistantMessage) {
      throw new Error('No response from assistant');
    }

    // Get the response content and clean it
    let content = assistantMessage.content[0].text.value;
    
    // Try to extract JSON if it's wrapped in code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    // Clean the content and try to parse
    content = content.trim();
    
    try {
      const flashcards = JSON.parse(content);

      // Validate flashcard format
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }

      flashcards.forEach((card, index) => {
        if (!card.question || !card.answer) {
          throw new Error(`Flashcard at index ${index} is missing question or answer`);
        }
      });

      return flashcards;

    } catch (error) {
      console.error('Error parsing assistant response. Response content:', content);
      throw new Error(`Failed to parse flashcards: ${error.message}`);
    }

  } catch (error) {
    console.error('Error in generateFlashcardsWithAssistant:', error);
    throw error;
  }
}


// Creating vector store and upload file to it
async function createVectorStoreAndUploadFile(file) {
  try {
    const vectorStore = await openai.beta.vectorStores.create({
      name: "Flashcard Content Vector Store",
    });

    if (!vectorStore || !vectorStore.id) {
      throw new Error('Failed to create a vector store.');
    }

    
    // Creating a temporary path to store file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);
    const fileContent = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(tempFilePath, fileContent);

    const fileObject = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: 'assistants',
    });

    const fileBatch = await openai.beta.vectorStores.fileBatches.create(
      vectorStore.id,
      {
        file_ids: [fileObject.id]
      }
    );

    let status = await openai.beta.vectorStores.fileBatches.retrieve(
      vectorStore.id,
      fileBatch.id
    );

    const maxAttempts = 30;
    let attempts = 0;
    while (status.status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      status = await openai.beta.vectorStores.fileBatches.retrieve(
        vectorStore.id,
        fileBatch.id
      );
      attempts++;
    }

    await fs.promises.unlink(tempFilePath);

    if (status.status === 'failed' || attempts >= maxAttempts) {
      throw new Error('File processing failed or timed out');
    }

    return vectorStore.id;

  } catch (error) {
    console.error('Error creating vector store or uploading files:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Creating vector store an uploading file
    const vectorStoreId = await createVectorStoreAndUploadFile(file);
    console.log('Vector store created successfully with ID:', vectorStoreId);
    
    // Generating flashcards
    const flashcards = await generateFlashcardsWithAssistant(vectorStoreId);
    console.log('Flashcards generated successfully:', flashcards.length);

    return NextResponse.json({
      flashcards,
      totalChunks: 1,
      processedChunks: 1,
    });

  } catch (error) {
    console.error('Full error details:', error);

    if (error.message.includes('rate_limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    if (error.message.includes('context_length_exceeded') || error.message.includes('maximum context length')) {
      return NextResponse.json(
        { error: 'Document is too large. Please try with a smaller document.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    );
  }
}
