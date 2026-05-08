import fs from 'fs';

// Set environment variable
process.env.GOOGLE_API_KEY = 'AIzaSyAo8T4I8AaZEmOUq_m2obSrLDUSWABWyUY';

// Dynamically import the handler
const { handler } = await import('./netlify/functions/generate.js');

// Create a test event
const testEvent = {
  httpMethod: 'POST',
  body: JSON.stringify({
    model: 'gemini-2.0-flash',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: 'Create a 2-sentence A1 reading passage about animals and 1 MCQ question about it. Return only valid JSON: {"topic":"Animals","passage":"...","questions":[{"type":"mcq","q":"?","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}'
      }
    ]
  })
};

console.log('🧪 Testing reading generation with gemini-2.0-flash...\n');

try {
  const response = await handler(testEvent);
  console.log('Response Status:', response.statusCode);
  
  const body = JSON.parse(response.body);
  if (body.error) {
    console.log('❌ ERROR:', body.error);
    process.exit(1);
  } else if (body.content && body.content[0] && body.content[0].text) {
    console.log('\n✅ SUCCESS! Generated content received!\n');
    const text = body.content[0].text;
    console.log('Raw response (first 600 chars):');
    console.log('─'.repeat(60));
    console.log(text.substring(0, 600));
    if (text.length > 600) console.log('...');
    console.log('─'.repeat(60));
    
    // Try to parse as JSON to validate
    try {
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      console.log('\n✅ Valid JSON response!');
      console.log('   Topic:', parsed.topic);
      console.log('   Passage length:', parsed.passage.length, 'chars');
      console.log('   Passage:', parsed.passage.substring(0, 100) + (parsed.passage.length > 100 ? '...' : ''));
      if (parsed.questions) {
        console.log('   Questions count:', parsed.questions.length);
        if (parsed.questions[0]) {
          console.log('   First question type:', parsed.questions[0].type);
          console.log('   First question:', parsed.questions[0].q);
        }
      }
    } catch (e) {
      console.log('\n⚠️  Response is not valid JSON:', e.message);
    }
  } else {
    console.log('❌ Unexpected response format:', body);
  }
} catch (err) {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
}
