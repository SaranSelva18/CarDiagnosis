import { useState } from 'react';
import { analyzeOBDCode, analyzeImage, analyzeVideo, type DiagnosisResult } from './lib/gemini';
import { Loader2, Upload, AlertCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'obd'>('photo');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [obdCode, setObdCode] = useState('');

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
        
        diagnosis = await analyzeVideo(file);
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
    
    if (!obdCode.trim()) {
      setError('Please enter an OBD code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const diagnosis = await analyzeOBDCode(obdCode.trim());
      setResult(diagnosis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze OBD code');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setObdCode('');
  };

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "#ffffff",
  };

  const formStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "15px",
    padding: "2rem",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  };

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.9)",
    color: "#1e3c72",
    border: "2px solid #4a69dd",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "1.1rem",
    width: "100%",
    maxWidth: "300px",
    letterSpacing: "0.1em",
  };

  const buttonStyle = {
    background: "linear-gradient(135deg, #4a69dd 0%, #6c8cff 100%)",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  };

  const clearButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #34495e 0%, #4a69dd 100%)",
    marginLeft: "1rem",
  };

  return (
    <div style={containerStyle}>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-blue-100"
        >
          {/* Header */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            <motion.h3 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white"
            >
              AI Car Diagnosis System
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-lg text-blue-100"
            >
              Upload a photo/video or enter an OBD code for instant diagnosis
            </motion.p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              {(['photo', 'video', 'obd'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(tab);
                    clearResults();
                  }}
                  className={`
                    w-1/3 py-4 px-1 text-center border-b-2 font-medium text-lg transition-all duration-200
                    ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Input Section */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'obd' ? (
                  <motion.form
                    key="obd-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleOBDSubmit}
                    style={formStyle}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="obdCode" className="block text-lg font-medium text-gray-700">
                        Enter OBD Code
                      </label>
                      <div className="mt-2 relative">
                        <input
                          type="text"
                          value={obdCode}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            if (value.length <= 5 && /^[A-Z0-9]*$/.test(value)) {
                              setObdCode(value);
                            }
                          }}
                          style={inputStyle}
                          placeholder="Enter OBD Code"
                          maxLength={5}
                        />
                        {obdCode && (
                          <button
                            type="button"
                            onClick={() => setObdCode('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={buttonStyle}
                      className={`
                        w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white
                        transition-all duration-200
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
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Analyze Code
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="file-upload"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <label className="block text-lg font-medium text-gray-700">
                      Upload {activeTab === 'photo' ? 'Photo' : 'Video'}
                    </label>
                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-all duration-200 group cursor-pointer">
                      <div className="space-y-2 text-center">
                        <Upload className="mx-auto h-16 w-16 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading Indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          transition={{ duration: 0.5 }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
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
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="rounded-lg bg-red-50 p-4 mt-6"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900">Diagnosis Results</h3>
                        <button
                          onClick={clearResults}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          <X size={20} />
                        </button>
                      </div>
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
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
