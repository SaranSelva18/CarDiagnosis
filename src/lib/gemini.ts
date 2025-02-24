import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DiagnosisResult {
  problem: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
  estimatedCost: {
    usd: string;
    inr: string;
  };
  additionalNotes?: string;
}

// Validate API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file');
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to handle API errors
function handleApiError(error: any): never {
  console.error('Gemini API Error:', error);
  
  // Check for specific error types
  if (error.message?.includes('API key not valid')) {
    throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY in .env file and make sure it is correct.');
  }
  
  if (error.message?.includes('quota exceeded')) {
    throw new Error('API quota exceeded. Please check your Google AI Studio quota limits.');
  }
  
  if (error.response?.status === 429) {
    throw new Error('Too many requests. Please try again in a few moments.');
  }
  
  throw new Error(error.message || 'An error occurred while communicating with the Gemini API');
}

// Helper function to convert file to base64
async function fileToGenerativePart(file: File): Promise<{
  inlineData: { data: string; mimeType: string };
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to extract and parse JSON from response
function extractAndParseJSON(text: string): any {
  try {
    // First try direct parsing
    return JSON.parse(text);
  } catch (e) {
    // If direct parsing fails, try to extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        throw new Error('Failed to parse response as JSON');
      }
    }
    throw new Error('No valid JSON found in response');
  }
}

// Helper function to convert USD to INR
function convertUSDtoINR(usdAmount: string): string {
  // Extract numeric values from the USD string
  const numbers = usdAmount.match(/\d+/g);
  if (!numbers) return 'Price unavailable';
  
  // If range is provided (e.g., "$100-$200")
  if (numbers.length === 2) {
    const minINR = Math.round(parseInt(numbers[0]) * 83); // Using approximate conversion rate
    const maxINR = Math.round(parseInt(numbers[1]) * 83);
    return `₹${minINR.toLocaleString('en-IN')}-₹${maxINR.toLocaleString('en-IN')}`;
  }
  
  // Single value
  const inr = Math.round(parseInt(numbers[0]) * 83);
  return `₹${inr.toLocaleString('en-IN')}`;
}

export async function analyzeOBDCode(code: string): Promise<DiagnosisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `You are an expert automotive diagnostic system. Analyze this OBD code: ${code}.
    Return ONLY a JSON object in this exact format, with NO additional text or markdown formatting:
    {
      "problem": "Detailed description of what the code indicates and its implications",
      "solution": "Step-by-step diagnostic and repair procedure, including required tools",
      "severity": "low/medium/high",
      "estimatedCost": "Cost range in USD (e.g., $100-$300)",
      "additionalNotes": "Important warnings, prerequisites, or related information"
    }

    Consider:
    1. Common causes and symptoms
    2. Associated vehicle systems
    3. Potential risks
    4. Required parts and labor
    5. Diagnostic steps
    6. Manufacturer considerations
    7. Related codes
    8. Environmental impact`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const parsedResponse = extractAndParseJSON(text);
    
    if (!parsedResponse.problem || !parsedResponse.solution || !parsedResponse.severity || !parsedResponse.estimatedCost) {
      throw new Error('Invalid response format: missing required fields');
    }

    return {
      problem: parsedResponse.problem,
      solution: parsedResponse.solution,
      severity: parsedResponse.severity.toLowerCase() as 'low' | 'medium' | 'high',
      estimatedCost: {
        usd: parsedResponse.estimatedCost,
        inr: convertUSDtoINR(parsedResponse.estimatedCost)
      },
      additionalNotes: parsedResponse.additionalNotes
    };
  } catch (error) {
    handleApiError(error);
  }
}

export async function analyzeImage(imageFile: File): Promise<DiagnosisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert automotive diagnostic system. Analyze this car image.
    Return ONLY a JSON object in this exact format, with NO additional text or markdown formatting:
    {
      "problem": "Detailed description of visible issues",
      "solution": "Step-by-step repair procedure",
      "severity": "low/medium/high",
      "estimatedCost": "Cost range in USD (e.g., $100-$300)",
      "additionalNotes": "Important warnings or observations"
    }

    Consider:
    1. Visible mechanical problems
    2. Fluid leaks or stains
    3. Wear patterns
    4. Rust or corrosion
    5. Safety concerns
    6. Part quality
    7. Required tools`;

    const imagePart = await fileToGenerativePart(imageFile);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const parsedResponse = extractAndParseJSON(text);
    
    if (!parsedResponse.problem || !parsedResponse.solution || !parsedResponse.severity || !parsedResponse.estimatedCost) {
      throw new Error('Invalid response format: missing required fields');
    }

    return {
      problem: parsedResponse.problem,
      solution: parsedResponse.solution,
      severity: parsedResponse.severity.toLowerCase() as 'low' | 'medium' | 'high',
      estimatedCost: {
        usd: parsedResponse.estimatedCost,
        inr: convertUSDtoINR(parsedResponse.estimatedCost)
      },
      additionalNotes: parsedResponse.additionalNotes
    };
  } catch (error) {
    handleApiError(error);
  }
}

export async function analyzeVideo(videoFile: File): Promise<DiagnosisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a progress event emitter
    const progressEmitter = new EventTarget();
    
    // Extract video frame and audio data
    const [videoFrame, audioTranscript] = await Promise.all([
      extractVideoFrame(videoFile),
      extractAudioTranscript(videoFile, progressEmitter)
    ]);

    const prompt = `You are an expert automotive diagnostic system. Analyze this video frame and audio transcript.
    Video frame shows visual symptoms, while audio transcript captures sounds.

    Audio Transcript:
    ${audioTranscript}

    Return ONLY a JSON object in this exact format, with NO additional text or markdown formatting:
    {
      "problem": "Detailed description combining visual and audio symptoms",
      "solution": "Step-by-step diagnostic procedure",
      "severity": "low/medium/high",
      "estimatedCost": "Cost range in USD (e.g., $100-$300)",
      "additionalNotes": "Important warnings or observations",
      "audioAnalysis": "Specific analysis of sounds heard in the video"
    }

    Consider:
    1. Motion-related issues
    2. Operating sounds (knocking, clicking, whining)
    3. Fluid leaks
    4. Smoke/exhaust
    5. Vibrations
    6. Sound patterns and frequencies
    7. Correlation between visual and audio symptoms
    8. Safety concerns
    9. Required equipment`;

    const imagePart = await fileToGenerativePart(videoFrame);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const parsedResponse = extractAndParseJSON(text);
    
    if (!parsedResponse.problem || !parsedResponse.solution || !parsedResponse.severity || !parsedResponse.estimatedCost) {
      throw new Error('Invalid response format: missing required fields');
    }

    return {
      problem: parsedResponse.problem,
      solution: parsedResponse.solution,
      severity: parsedResponse.severity.toLowerCase() as 'low' | 'medium' | 'high',
      estimatedCost: {
        usd: parsedResponse.estimatedCost,
        inr: convertUSDtoINR(parsedResponse.estimatedCost)
      },
      additionalNotes: `${parsedResponse.audioAnalysis}\n\n${parsedResponse.additionalNotes || ''}`
    };
  } catch (error) {
    handleApiError(error);
  }
}

// Helper function to extract a frame from a video
async function extractVideoFrame(videoFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadeddata = () => {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the first frame
      ctx?.drawImage(video, 0, 0);
      
      // Convert canvas to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
          resolve(file);
        } else {
          reject(new Error('Failed to extract video frame'));
        }
      }, 'image/jpeg');
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

// Helper function to extract audio transcript from video
async function extractAudioTranscript(videoFile: File, progressEmitter: EventTarget): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        video.src = reader.result as string;
        
        // Wait for video metadata to load
        await new Promise(resolve => video.addEventListener('loadedmetadata', resolve));
        
        const duration = video.duration;
        const source = audioContext.createMediaElementSource(video);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Configure analyser
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Process audio data
        let audioDescription = '';
        video.play();

        const processFrame = () => {
          analyser.getByteFrequencyData(dataArray);
          
          // Analyze frequency data for common car problems
          const frequencies = {
            lowEnd: dataArray.slice(0, bufferLength / 4),
            midRange: dataArray.slice(bufferLength / 4, bufferLength / 2),
            highEnd: dataArray.slice(bufferLength / 2)
          };

          // Detect patterns in different frequency ranges
          const patterns = analyzeFrequencyPatterns(frequencies);
          audioDescription += patterns + '\n';

          if (video.currentTime < duration) {
            // Emit progress
            progressEmitter.dispatchEvent(new CustomEvent('progress', {
              detail: (video.currentTime / duration) * 100
            }));
            requestAnimationFrame(processFrame);
          } else {
            // Cleanup
            video.pause();
            audioContext.close();
            resolve(audioDescription);
          }
        };

        processFrame();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(videoFile);
  });
}

// Helper function to analyze frequency patterns
function analyzeFrequencyPatterns(frequencies: { 
  lowEnd: Uint8Array, 
  midRange: Uint8Array, 
  highEnd: Uint8Array 
}): string {
  const patterns = [];
  
  // Analyze low frequency patterns (engine noise, knocking)
  const lowEndAvg = Array.from(frequencies.lowEnd).reduce((a, b) => a + b, 0) / frequencies.lowEnd.length;
  if (lowEndAvg > 150) patterns.push('Heavy low-frequency noise detected (possible engine knocking or rumbling)');
  
  // Analyze mid-range patterns (belt noise, bearing issues)
  const midRangeAvg = Array.from(frequencies.midRange).reduce((a, b) => a + b, 0) / frequencies.midRange.length;
  if (midRangeAvg > 120) patterns.push('Significant mid-range frequencies (possible belt or bearing issues)');
  
  // Analyze high-frequency patterns (brake squealing, metal-on-metal)
  const highEndAvg = Array.from(frequencies.highEnd).reduce((a, b) => a + b, 0) / frequencies.highEnd.length;
  if (highEndAvg > 90) patterns.push('High-frequency noise detected (possible brake squealing or metal-on-metal contact)');
  
  return patterns.join('\n');
}
