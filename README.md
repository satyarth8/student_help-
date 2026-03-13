# GEC Khagaria — College Voice Assistant
https://excalidraw.com/#json=FMs9KYcev53T7ZtJXe5lj,YrZdWKYiavf0Jfwi0oKPCQ
An AI-powered voice guide for **Government Engineering College, Khagaria, Bihar**. Built with Vite, vanilla JS, HTML/CSS, the **Gemini 3.0 Flash Preview** model, and the Web Speech API. 

The assistant provides concise, high-quality answers regarding college facilities, admission processes, faculty, sports, and hostels based on a meticulously filled `knowledge_base.json`.

---

## ✨ Features

- **🗣️ Voice & Text Interface**: Talk naturally through your microphone or type your questions.
- **🇮🇳 Bilingual**: Understands and replies in both English and Hindi.
- **⚡ Super Fast**: Powered by Gemini 3.0 Flash Preview and Vite for instant processing.
- **✨ 4Cs Enforced**: Responses are Clear, Concise, Courteous, and Correct.
- **🎯 Context Boundary**: The AI politely refuses to answer queries outside the context of GEC Khagaria.
- **🎨 Modern Dark UI**: Beautiful orbital mic indicator with a deep space aesthetic.

---

## 🛠️ Tech Stack

- **Frontend Build Tool**: [Vite](https://vitejs.dev/)
- **UI/Logic**: HTML5, Vanilla JavaScript, CSS3
- **AI Backend**: `@google/genai` SDK using `gemini-3-flash-preview`
- **Voice Features**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## 🚀 Local Deployment Setup

### 1. Requirements
- [Node.js](https://nodejs.org/) (v16+)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- A modern browser that supports the Web Speech API (Chrome or Edge recommended).

### 2. Installation Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/gec-khagaria-assistant.git
cd gec-khagaria-assistant
npm install
```

### 3. Add API Key

Create a `.env` file in the root directory and add your Google Gemini API key:

```env
VITE_GEMINI_API_KEY=AIzaSy...your_real_key_here
```

### 4. Run Development Server

Start the fast Vite local server:

```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🌐 Production Deployment (Coming Later)

When ready for full web deployment, build the optimized static project via:

```bash
npm run build
```

The output will be in the `/dist` folder. You can directly import the GitHub repository into platforms like **Vercel** or **Netlify** — they will naturally detect the Vite setup and build it correctly. 

**Note for Vercel deployers:** Make sure to map your API Key as an environment variable in the dashboard (`VITE_GEMINI_API_KEY`) so the deployed app can access it.

---

## 📁 Key File Structure

```text
├── index.html               # Main application view structure
├── app.js                   # UI Logic, Voice Engine, and Gemini Integration
├── styles.css               # Futuristic Animated Stylesheet
├── knowledge_base.json      # The comprehensive brain & data of the college
├── package.json             # NPM config & Vite definition
└── .env                     # Sensitive file for API Key (ignored by Git)
```

## 🤝 Project Contribution

1. Edit `knowledge_base.json` to safely alter any dates, names, or specifics regarding GEC Khagaria. The AI instantly consumes these live edits locally.
2. Edit `app.js` to augment the Gemini prompt instructions. 

**Maintained for Government Engineering College, Khagaria.**
