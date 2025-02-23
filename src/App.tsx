import { useState } from 'react';
import { analyzeOBDCode, analyzeImage, analyzeVideo, type DiagnosisResult } from './lib/gemini';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'obd'>('photo');
  const [isLoading, setIsLoading] = useState(false);
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
    setError(null);
    try {
      let diagnosis: DiagnosisResult;
      if (activeTab === 'photo') {
        diagnosis = await analyzeImage(file);
      } else {
        diagnosis = await analyzeVideo(file);
      }
      setResult(diagnosis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze file');
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-800">
            <h3 className="text-lg leading-6 font-medium text-white">
              AI Car Diagnosis System
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">
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
                    w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                    ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            {/* Input Section */}
            <div className="space-y-6">
              {activeTab === 'obd' ? (
                <form onSubmit={handleOBDSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="obdCode" className="block text-sm font-medium text-gray-700">
                      Enter OBD Code
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="obdCode"
                        id="obdCode"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., P0300"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                      w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                      ${
                        isLoading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Code'
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload {activeTab === 'photo' ? 'Photo' : 'Video'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
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
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-red-50 p-4"
                >
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 bg-white shadow overflow-hidden rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Problem</dt>
                        <dd className="mt-1 text-sm text-gray-900">{result.problem}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Solution</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                          {result.solution}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Severity</dt>
                        <dd className="mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${
                                result.severity === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : result.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }
                            `}
                          >
                            {result.severity}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                        <dd className="mt-1 text-sm text-gray-900">{result.estimatedCost}</dd>
                      </div>
                      {result.additionalNotes && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">{result.additionalNotes}</dd>
                        </div>
                      )}
                    </dl>
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
