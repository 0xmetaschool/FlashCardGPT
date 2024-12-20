import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractTextFromFile(file) {
  try {
    // Get array buffer of the uploaded file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let textContent = '';

    if (file.type === 'text/plain') {
      // Handle text files
      textContent = buffer.toString('utf-8');
    } 
    else if (file.type === 'application/pdf') {
      // Special handling for PDF files
      const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
      
      try {
        const pdfData = await pdf(buffer);
        textContent = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        throw new Error('Could not parse PDF file. Please check the file format.');
      }
    }
    else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      // Handle Word files
      const { default: mammoth } = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    }
    else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    return textContent;
  } catch (error) {
    console.error('Error in extractTextFromFile:', error);
    throw error;
  }
}

// Function to generate flashcards using OpenAI GPT
async function generateFlashcards(content) {
  try {
    const prompt = `Generate flashcards from the following content. Respond ONLY with a JSON array of flashcard objects. Each object must have "question" and "answer" fields. Do not include any other text or explanations.

Content:
${content}

Flashcards:
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a flashcard generation assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message.content;

    // Clean the content and try to parse
    let jsonContent = assistantMessage.trim();

    // Try to extract JSON if it's wrapped in code blocks
    const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    try {
      const flashcards = JSON.parse(jsonContent);

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
      console.error('Error parsing assistant response. Response content:', jsonContent);
      throw new Error(`Failed to parse flashcards: ${error.message}`);
    }

  } catch (error) {
    console.error('Error in generateFlashcards:', error);
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

    const content = await extractTextFromFile(file);

    if (!content) {
      return NextResponse.json(
        { error: 'The uploaded document is empty or could not be read.' },
        { status: 400 }
      );
    }

    // Generate flashcards using OpenAI GPT
    const flashcards = await generateFlashcards(content);

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