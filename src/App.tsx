import React, { useState } from 'react';
import { Upload, Car, Terminal, Wrench, DollarSign, FileCode, Camera, Video, Cpu, Notebook as Robot } from 'lucide-react';

interface DiagnosisResult {
  issue: string;
  confidence: number;
  estimatedCost: {
    min: number;
    max: number;
  };
  steps: string[];
}

function App() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'obd'>('photo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const handleFileUpload = () => {
    setLoading(true);
    setTimeout(() => {
      setResult({
        issue: "Faulty Mass Air Flow Sensor",
        confidence: 92,
        estimatedCost: {
          min: 150,
          max: 300
        },
        steps: [
          "Remove the MAF sensor from the air intake housing",
          "Clean the sensor using MAF-specific cleaner",
          "Check all electrical connections",
          "Replace if cleaning doesn't resolve the issue"
        ]
      });
      setLoading(false);
    }, 2000);
  };

  const handleOBDSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResult({
        issue: "Oxygen Sensor Malfunction",
        confidence: 88,
        estimatedCost: {
          min: 200,
          max: 400
        },
        steps: [
          "Locate the faulty O2 sensor",
          "Disconnect the battery",
          "Remove and replace the sensor",
          "Clear error codes"
        ]
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div 
      className="min-h-screen bg-black text-white relative"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
          url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/20 to-black/80 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 space-x-4">
            <Robot className="w-16 h-16 text-cyan-400 animate-pulse" />
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
                AutoDiagnostics AI
              </h1>
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <p className="text-cyan-400 text-lg">Quantum-Powered Vehicle Analysis</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto backdrop-blur-lg bg-gray-900/40 rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/30">
          <div className="flex border-b border-cyan-500/30">
            {[
              { id: 'photo', icon: Camera, label: 'Photo Analysis' },
              { id: 'video', icon: Video, label: 'Video Scan' },
              { id: 'obd', icon: Terminal, label: 'OBD Interface' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'photo' | 'video' | 'obd')}
                className={`flex-1 py-6 px-6 ${
                  activeTab === id 
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400' 
                    : 'hover:bg-gray-800/50 text-gray-300 hover:text-cyan-400'
                } flex items-center justify-center gap-3 transition-all duration-300`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab !== 'obd' ? (
              <div className="border-2 border-dashed border-cyan-500/30 rounded-xl p-12 text-center hover:border-cyan-400/50 transition-colors duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full" />
                  <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-bounce" />
                </div>
                <label className="block">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 rounded-lg cursor-pointer hover:from-cyan-400 hover:to-blue-500 inline-block font-medium transition-all duration-300 shadow-lg shadow-cyan-500/20">
                    Upload {activeTab === 'photo' ? 'Photo' : 'Video'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept={activeTab === 'photo' ? "image/*" : "video/*"}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            ) : (
              <form onSubmit={handleOBDSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-cyan-400">Enter OBD-II Code</label>
                  <input
                    type="text"
                    placeholder="e.g., P0301"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 font-medium shadow-lg shadow-cyan-500/20"
                >
                  Initialize Scan
                </button>
              </form>
            )}

            {loading && (
              <div className="mt-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/10 blur-3xl rounded-full" />
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
                </div>
                <p className="mt-4 text-cyan-400 font-medium">Quantum Analysis in Progress...</p>
              </div>
            )}

            {result && !loading && (
              <div className="mt-12 space-y-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-medium flex items-center text-cyan-400">
                      <Wrench className="w-6 h-6 mr-2" />
                      Diagnosis
                    </h3>
                    <span className="bg-cyan-500/20 px-4 py-1 rounded-full text-cyan-400 text-sm font-medium">
                      {result.confidence}% Confidence
                    </span>
                  </div>
                  <p className="text-lg text-gray-300">{result.issue}</p>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
                  <h3 className="text-xl font-medium mb-4 flex items-center text-cyan-400">
                    <DollarSign className="w-6 h-6 mr-2" />
                    Estimated Cost
                  </h3>
                  <p className="text-3xl text-gray-300">
                    ${result.estimatedCost.min} - ${result.estimatedCost.max}
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
                  <h3 className="text-xl font-medium mb-4 flex items-center text-cyan-400">
                    <FileCode className="w-6 h-6 mr-2" />
                    Repair Protocol
                  </h3>
                  <ol className="list-decimal list-inside space-y-3">
                    {result.steps.map((step, index) => (
                      <li key={index} className="text-gray-300 pl-2">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;