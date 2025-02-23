# AI Car Diagnosis System

An intelligent car diagnostic system that uses Google's Gemini AI to analyze:
- OBD-II codes
- Car images
- Car videos

## Features

- **OBD Code Analysis**: Get detailed diagnostic information from OBD-II codes
- **Image Analysis**: Upload car images for visual diagnosis
- **Video Analysis**: Upload car videos for motion-based diagnosis
- **Detailed Reports**: Get comprehensive reports including:
  - Problem description
  - Step-by-step solutions
  - Severity assessment
  - Cost estimates
  - Additional notes and warnings

## Tech Stack

- React + TypeScript
- Vite
- Google Gemini AI
- Tailwind CSS
- Framer Motion

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/stsukesh/AiCarDiagnosisSystem.git
   cd AiCarDiagnosisSystem
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Get your API key:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **OBD Code Analysis**:
   - Enter your OBD-II code
   - Get detailed diagnostic information

2. **Image Analysis**:
   - Upload a clear image of the car part/issue
   - Get visual diagnosis and repair steps

3. **Video Analysis**:
   - Upload a short video showing the issue
   - Get motion-based diagnosis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
