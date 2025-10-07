import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client lazily to avoid build-time errors
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 },
      );
    }

    // Initialize OpenAI client
    const openai = getOpenAIClient();

    // Convert audio file to buffer and create File object
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Transcribe audio using Whisper
    console.log('Transcribing audio...');

    // Create a File object from the buffer
    const audioFileForAPI = new File([buffer], 'audio.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForAPI,
      model: 'whisper-1',
    });

    const transcribedText = transcription.text;
    console.log('Transcription complete:', transcribedText.substring(0, 100));

    // Step 2: Process transcription with GPT-4o
    console.log('Processing with GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Echo Notes AI - an intelligent note assistant.
Given a voice note transcription, analyze it and create:
1. A concise summary (2-4 sentences capturing the essence)
2. 3-6 key points (main ideas or important information)
3. 2-5 clear action items (specific tasks or next steps)

Format your response as JSON with this exact structure:
{
  "summary": "your summary here",
  "key_points": ["point 1", "point 2", "point 3"],
  "action_items": ["action 1", "action 2"]
}

Be concise, clear, and actionable. If there are no clear action items, still provide thoughtful suggestions.`,
        },
        {
          role: 'user',
          content: transcribedText,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
    console.log('AI processing complete');

    return NextResponse.json({
      transcription: transcribedText,
      summary: aiResponse.summary || '',
      key_points: aiResponse.key_points || [],
      action_items: aiResponse.action_items || [],
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      {
        error: 'Failed to process audio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
