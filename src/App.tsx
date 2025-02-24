import { useState } from 'react';
import { analyzeOBDCode, analyzeImage, analyzeVideo, type DiagnosisResult } from './lib/gemini';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'obd'>('photo');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Validate file type
    if (activeTab === 'photo' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (activeTab === 'video' && !file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    try {
      let diagnosis: DiagnosisResult;
      if (activeTab === 'photo') {
        diagnosis = await analyzeImage(file);
      } else {
        // Create progress event listener for video analysis
        const progressEmitter = new EventTarget();
        progressEmitter.addEventListener('progress', ((event: CustomEvent) => {
          setLoadingProgress(event.detail);
        }) as EventListener);
        
        diagnosis = await analyzeVideo(file, progressEmitter);
      }
      setResult(diagnosis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze file');
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleOBDSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = formData.get('obdCode') as string;

    if (!code) {
      setError('Please enter an OBD code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const diagnosis = await analyzeOBDCode(code);
      setResult(diagnosis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze OBD code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-blue-100">
          {/* Header */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h3 className="text-2xl font-bold text-white">
              AI Car Diagnosis System
            </h3>
            <p className="mt-2 text-lg text-blue-100">
              Upload a photo/video or enter an OBD code for instant diagnosis
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              {(['photo', 'video', 'obd'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setError(null);
                    setResult(null);
                  }}
                  className={`
                    w-1/3 py-4 px-1 text-center border-b-2 font-medium text-lg transition-colors duration-200
                    ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Input Section */}
            <div className="space-y-6">
              {activeTab === 'obd' ? (
                <form onSubmit={handleOBDSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="obdCode" className="block text-lg font-medium text-gray-700">
                      Enter OBD Code
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="obdCode"
                        id="obdCode"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-lg border-gray-300 rounded-lg"
                        placeholder="e.g., P0300"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                      w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white
                      transition-colors duration-200
                      ${
                        isLoading
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Code'
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <label className="block text-lg font-medium text-gray-700">
                    Upload {activeTab === 'photo' ? 'Photo' : 'Video'}
                  </label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors duration-200">
                    <div className="space-y-2 text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept={activeTab === 'photo' ? 'image/*' : 'video/*'}
                            onChange={handleFileUpload}
                            disabled={isLoading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {activeTab === 'photo' ? 'PNG, JPG, GIF' : 'MP4, WebM'} up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ duration: 0.5 }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 min-w-[4rem]">
                      {Math.round(loadingProgress)}%
                    </span>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {activeTab === 'video' ? 'Analyzing video and audio...' : 'Processing...'}
                  </p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-red-50 p-4 mt-6"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-semibold text-gray-900">Diagnosis Results</h3>
                  </div>
                  <div className="px-6 py-5 space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Problem</h4>
                      <p className="mt-2 text-gray-600">{result.problem}</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Solution</h4>
                      <p className="mt-2 text-gray-600 whitespace-pre-line">{result.solution}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Severity</h4>
                        <div className="mt-2">
                          <span className={`
                            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                            ${
                              result.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : result.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }
                          `}>
                            {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Estimated Cost</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-gray-600">{result.estimatedCost.usd}</p>
                          <p className="text-gray-600">{result.estimatedCost.inr}</p>
                        </div>
                      </div>
                    </div>
                    {result.additionalNotes && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Additional Notes</h4>
                        <p className="mt-2 text-gray-600 whitespace-pre-line">{result.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
