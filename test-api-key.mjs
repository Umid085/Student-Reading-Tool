import fetch from 'node-fetch';

const apiKey = 'AIzaSyAo8T4I8AaZEmOUq_m2obSrLDUSWABWyUY';

console.log('Testing Google Gemini API key...\n');

try {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { method: 'GET', timeout: 10000 }
  );

  console.log('Status:', response.status);
  
  if (!response.ok) {
    console.log('❌ API returned error');
    const text = await response.text();
    console.log('Response:', text.substring(0, 200));
    process.exit(1);
  }

  const data = await response.json();
  
  if (data.models && data.models.length > 0) {
    console.log('✅ API Key is valid!\n');
    console.log('Available models for generateContent:\n');
    
    data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .forEach(m => {
        console.log('  -', m.name.replace('models/', ''));
      });
  } else {
    console.log('No models found');
  }
} catch (err) {
  console.error('❌ Request failed:', err.message);
}
