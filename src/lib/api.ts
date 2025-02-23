import axios from 'axios';

export interface DiagnosisResult {
  problem: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
  estimatedCost: string;
  additionalNotes?: string;
}

// Get API key from environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Validate API key
if (!OPENAI_API_KEY || typeof OPENAI_API_KEY !== 'string' || !OPENAI_API_KEY.startsWith('sk-')) {
  console.error('Invalid OpenAI API key format. Key should start with "sk-"');
}

// Mock OBD code responses for testing
const mockOBDResponses: Record<string, DiagnosisResult> = {
  'P0300': {
    problem: 'Random/Multiple Cylinder Misfire Detected',
    solution: '1. Check spark plugs and replace if worn\n2. Inspect ignition coils\n3. Check fuel injectors\n4. Verify fuel pressure\n5. Inspect vacuum leaks',
    severity: 'high',
    estimatedCost: '$150-$1000',
    additionalNotes: 'Should be addressed immediately to prevent catalytic converter damage'
  },
  'P0420': {
    problem: 'Catalyst System Efficiency Below Threshold',
    solution: '1. Check exhaust leaks\n2. Inspect oxygen sensors\n3. Test catalytic converter\n4. Replace if necessary',
    severity: 'medium',
    estimatedCost: '$400-$2500',
    additionalNotes: 'May affect emissions and fuel efficiency'
  }
};

// Mock image analysis responses for testing
const mockImageResponses: DiagnosisResult[] = [
  {
    problem: 'Worn Brake Pads',
    solution: '1. Measure brake pad thickness\n2. Replace brake pads if less than 3mm\n3. Check rotors for damage\n4. Test brake system',
    severity: 'high',
    estimatedCost: '$200-$400',
    additionalNotes: 'Regular brake maintenance is crucial for safety'
  },
  {
    problem: 'Oil Leak',
    solution: '1. Clean affected area\n2. Identify leak source\n3. Replace gasket or seal\n4. Check oil level\n5. Monitor for further leaks',
    severity: 'medium',
    estimatedCost: '$150-$500',
    additionalNotes: 'Address oil leaks promptly to prevent engine damage'
  },
  {
    problem: 'Tire Wear Pattern',
    solution: '1. Check tire pressure\n2. Perform wheel alignment\n3. Rotate tires\n4. Replace if wear is severe',
    severity: 'medium',
    estimatedCost: '$50-$800',
    additionalNotes: 'Uneven wear may indicate alignment issues'
  }
];

// Default mock response for unknown codes
const defaultMockResponse: DiagnosisResult = {
  problem: 'Generic OBD-II Code',
  solution: '1. Read code with scanner\n2. Inspect related systems\n3. Consult mechanic if unsure',
  severity: 'medium',
  estimatedCost: '$50-$500',
  additionalNotes: 'Further diagnosis may be needed'
};

// Initialize axios with base configuration
const api = axios.create({
  baseURL: 'https://api.openai.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'OpenAI-Beta': 'assistants=v1'
  },
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => status >= 200 && status < 500 // Don't reject if status is 2xx/3xx/4xx
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    url: request.url,
    method: request.method,
    headers: request.headers
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    return Promise.reject(error);
  }
);

export async function analyzeOBDCode(code: string): Promise<DiagnosisResult> {
  console.log('Analyzing OBD code:', code);
  
  // Use mock responses for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock response for testing');
    return mockOBDResponses[code] || {
      ...defaultMockResponse,
      problem: `${defaultMockResponse.problem} (Code: ${code})`,
      additionalNotes: `Code ${code}: ${defaultMockResponse.additionalNotes}`
    };
  }

  try {
    const response = await api.post('/v1/chat/completions', {
      model: "gpt-3.5-turbo", 
      messages: [
        {
          role: "system",
          content: "You are an expert automotive diagnostic system. You analyze OBD codes and provide detailed, accurate diagnostics. Respond ONLY with a JSON object in the exact format specified by the user."
        },
        {
          role: "user",
          content: `Analyze this OBD code: ${code}. Return ONLY a JSON object in this exact format (no other text):
{
  "problem": "Brief description of what the code indicates",
  "solution": "Step-by-step solution to fix the issue",
  "severity": "low/medium/high",
  "estimatedCost": "Cost range in USD",
  "additionalNotes": "Important warnings or context"
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    console.log('Raw API Response:', response.data);

    const messageContent = response.data?.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.error('Invalid API response structure:', response.data);
      throw new Error('Invalid API response format');
    }

    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(messageContent.trim());
      
      // Validate the parsed response
      if (!parsedResponse.problem || !parsedResponse.solution || !parsedResponse.severity || !parsedResponse.estimatedCost) {
        console.error('Missing required fields in response:', parsedResponse);
        throw new Error('Invalid response format: missing required fields');
      }

      // Normalize the response
      return {
        problem: parsedResponse.problem,
        solution: parsedResponse.solution,
        severity: parsedResponse.severity.toLowerCase() as 'low' | 'medium' | 'high',
        estimatedCost: parsedResponse.estimatedCost,
        additionalNotes: parsedResponse.additionalNotes || undefined
      };
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      console.error('Raw content:', messageContent);
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      // Check for quota exceeded error
      if (error.response?.data?.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing details.');
      }
      // Check for other common errors
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      if (!error.response && error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your internet connection.');
      }
      // Log the error details
      console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    // Re-throw the error with a more specific message if possible
    throw new Error(error.response?.data?.error?.message || error.message || 'Failed to analyze OBD code');
  }
}

export async function analyzeImage(imageFile: File): Promise<DiagnosisResult> {
  console.log('Analyzing image:', imageFile.name);
  
  // Use mock responses for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock response for testing');
    // Randomly select a mock response
    const randomIndex = Math.floor(Math.random() * mockImageResponses.length);
    return {
      ...mockImageResponses[randomIndex],
      additionalNotes: `Analyzing image: ${imageFile.name}. ${mockImageResponses[randomIndex].additionalNotes}`
    };
  }

  try {
    const base64Image = await fileToBase64(imageFile);
    const response = await api.post('/v1/chat/completions', {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive diagnostic system. You analyze car images and provide detailed, accurate diagnostics. Respond ONLY with a JSON object in the exact format specified by the user."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this car image. Return ONLY a JSON object in this exact format (no other text):
{
  "problem": "Brief description of visible issues",
  "solution": "Step-by-step solution to fix the issue",
  "severity": "low/medium/high",
  "estimatedCost": "Cost range in USD",
  "additionalNotes": "Important warnings or context"
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    console.log('Raw API Response:', response.data);

    const messageContent = response.data?.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.error('Invalid API response structure:', response.data);
      throw new Error('Invalid API response format');
    }

    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(messageContent.trim());
      
      // Validate the parsed response
      if (!parsedResponse.problem || !parsedResponse.solution || !parsedResponse.severity || !parsedResponse.estimatedCost) {
        console.error('Missing required fields in response:', parsedResponse);
        throw new Error('Invalid response format: missing required fields');
      }

      // Normalize the response
      return {
        problem: parsedResponse.problem,
        solution: parsedResponse.solution,
        severity: parsedResponse.severity.toLowerCase() as 'low' | 'medium' | 'high',
        estimatedCost: parsedResponse.estimatedCost,
        additionalNotes: parsedResponse.additionalNotes || undefined
      };
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      console.error('Raw content:', messageContent);
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      // Check for quota exceeded error
      if (error.response?.data?.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing details.');
      }
      // Check for other common errors
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      console.error('API Error Details:', error.response?.data);
    }
    // Re-throw the error with a more specific message if possible
    throw new Error(error.response?.data?.error?.message || error.message || 'Failed to analyze image');
  }
}

export async function analyzeVideo(videoFile: File): Promise<DiagnosisResult> {
  console.log('Analyzing video:', videoFile.name);
  
  // Use mock responses for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock response for testing');
    // Use the same mock responses as images but with video-specific notes
    const randomIndex = Math.floor(Math.random() * mockImageResponses.length);
    return {
      ...mockImageResponses[randomIndex],
      additionalNotes: `Analyzing video: ${videoFile.name}. ${mockImageResponses[randomIndex].additionalNotes}`
    };
  }

  // For now, we'll treat videos as images
  return analyzeImage(videoFile);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}
