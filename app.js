/**
 * GEC Khagaria College Voice Assistant — app.js
 * Uses @google/genai SDK directly via Vite
 */

import { GoogleGenAI } from '@google/genai';
import knowledgeBase from './knowledge_base.json';

// ── CONFIG ──────────────────────────────────────────────────────
const MODEL = 'gemini-3-flash-preview'; // Switched to 3.0 preview to fix 429 limits
const MAX_HISTORY = 20;
const SILENCE_TIMEOUT = 2000;
const SPEECH_RATE = 1.0;

// ── TOPIC PRESETS ────────────────────────────────────────────────
const TOPIC_QUESTIONS = {
  en: {
    campus:    'Give me an overview of the GEC Khagaria campus, its history, and facilities.',
    labs:      'What laboratories are available at GEC Khagaria and what equipment do they have?',
    hostel:    'Tell me about the hostel facilities at GEC Khagaria — capacity, amenities and rules.',
    admission: 'How do I get admission to GEC Khagaria? What is the process and documents needed?',
    sports:    'What sports and recreation facilities are available at GEC Khagaria?',
    contacts:  'Who are the faculty and HODs at GEC Khagaria with their contact details?',
  },
  hi: {
    campus:    'GEC खगड़िया का कैंपस और उसकी सुविधाओं के बारे में बताइए।',
    labs:      'GEC खगड़िया में कौन-कौन सी प्रयोगशालाएँ हैं और उनमें क्या उपकरण हैं?',
    hostel:    'GEC खगड़िया में हॉस्टल की सुविधाएँ, क्षमता और नियम क्या हैं?',
    admission: 'GEC खगड़िया में दाखिला कैसे मिलता है? प्रक्रिया और जरूरी दस्तावेज बताइए।',
    sports:    'GEC खगड़िया में खेल और मनोरंजन की क्या सुविधाएँ हैं?',
    contacts:  'GEC खगड़िया के फैकल्टी और HODs की जानकारी और संपर्क नंबर बताइए।',
  },
};

// ── UI LABELS ────────────────────────────────────────────────────
const LABELS = {
  en: {
    statusIdle:      'Tap to Speak',
    statusHint:      'Ask anything about GEC Khagaria',
    statusListening: 'Listening...',
    statusHintListen:'Speak now — I\'m listening',
    statusThinking:  'Thinking...',
    statusHintThink: 'Gemini AI is processing your question',
    statusSpeaking:  'Speaking...',
    statusHintSpeak: 'Tap orb or type to interrupt',
    topicsLabel:     'Quick Questions',
    chatHeader:      'Conversation',
    textPlaceholder: 'Type your question here...',
    errorNoSpeech:   'No speech detected. Please try again.',
    errorApi:        'Could not reach the AI. Check your connection.',
    errorMicDenied:  'Microphone access denied. Please use text input below.',
    stopBtn:         '⏹ Stop Speaking',
    rateLimit:       'Too many requests — please wait 30 seconds and try again.',
  },
  hi: {
    statusIdle:      'बोलने के लिए टैप करें',
    statusHint:      'GEC खगड़िया के बारे में कुछ भी पूछें',
    statusListening: 'सुन रहा हूँ...',
    statusHintListen:'अभी बोलें — मैं सुन रहा हूँ',
    statusThinking:  'सोच रहा हूँ...',
    statusHintThink: 'AI आपके सवाल पर काम कर रहा है',
    statusSpeaking:  'बोल रहा हूँ...',
    statusHintSpeak: 'रोकने के लिए टैप करें',
    topicsLabel:     'जल्दी सवाल पूछें',
    chatHeader:      'बातचीत',
    textPlaceholder: 'यहाँ अपना सवाल लिखें...',
    errorNoSpeech:   'कोई आवाज़ नहीं मिली। कृपया फिर से प्रयास करें।',
    errorApi:        'AI से संपर्क नहीं हो पाया। कनेक्शन जाँचें।',
    errorMicDenied:  'माइक्रोफ़ोन अनुमति नहीं मिली। नीचे टेक्स्ट बॉक्स से पूछें।',
    stopBtn:         '⏹ बोलना रोकें',
    rateLimit:       'बहुत अधिक अनुरोध — कृपया 30 सेकंड बाद फिर से प्रयास करें।',
  },
};

// ── SYSTEM PROMPT ────────────────────────────────────────────────
function buildSystemPrompt() {
  const kb = knowledgeBase;
  return `You are a friendly, helpful AI voice guide for ${kb.meta.college_name} (${kb.meta.college_name_hindi}), located at ${kb.meta.current_campus_location}.

YOUR ROLE:
- Help students, visitors, parents, and prospective students learn everything about this college
- Ensure responses are Clear, Concise, Courteous, and Correct.
- Be warm and conversational — like a knowledgeable senior student giving a campus tour.
- Respond in the EXACT SAME LANGUAGE the user writes in (Hindi/English).
- Keep voice answers brief (2-3 sentences max).
- NEVER make up facts. If information is not in the knowledge base, do not invent it.
- If the user asks a question completely outside the context of GEC Khagaria (like general knowledge, coding, or other topics), POLITELY DECLINE and ask them to keep the topic focused on GEC Khagaria.
- Always be positive and encouraging about the college.

COLLEGE KNOWLEDGE BASE:
${JSON.stringify(kb)}

KEY FACTS TO ALWAYS REMEMBER:
- Principal: Dr. Mani Bhushan
- Established: 2019 (Purnea) → shifted to Khagaria on 30 Dec 2022, inaugurated by CM Nitish Kumar on 28 Jan 2023
- Affiliated to Bihar Engineering University (BEU), Patna | Approved by AICTE
- 5 B.Tech branches: Civil (120 seats), Mechanical (60), Electrical (60), CSE-IoT (60), CSE-AI&ML (60) — Total 360/year
- Admission: JEE Main → UGEAC counselling at bceceboard.bihar.gov.in
- Boys Hostel: 300 capacity | Girls Hostel: 200 capacity — both WiFi, RO water, geyser, mess
- Library: 11,987 books, 4000+ sq.ft, Mon–Sat 10AM–5PM
- Annual fest: Fusion Utsav (by NEXUS and PANKH clubs)
- Placement: Avg 2.70 LPA, Highest 6 LPA (first batch 2023). Companies: HCL, BYJU'S, EdiGlobe, HikeEdu
- Anti-ragging helpline: 1800-180-5522
- Official website: geckhagaria.org.in`;
}

// ── GEMINI CHAT ──────────────────────────────────────────────────
const GeminiChat = {
  ai: null,
  history: [],
  systemPrompt: '',

  init() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set in .env file');
    this.ai = new GoogleGenAI({ apiKey });
    this.systemPrompt = buildSystemPrompt();
    this.history = [];
  },

  async send(userMessage) {
    this.history.push({ role: 'user', content: userMessage });
    const recent = this.history.slice(-MAX_HISTORY);

    const contents = recent.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await this.ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: this.systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      contents,
    });

    const text = response.text;
    this.history.push({ role: 'assistant', content: text });
    return text;
  },

  clear() { this.history = []; },
};

// ── VOICE INPUT ──────────────────────────────────────────────────
const VoiceInput = {
  recognition: null,
  isListening: false,
  silenceTimer: null,
  transcript: '',
  onResult: null,
  onError: null,

  get isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },

  init(lang = 'en-IN') {
    if (!this.isSupported) return false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = lang;

    this.recognition.onresult = (e) => {
      this.transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        this.transcript += e.results[i][0].transcript;
      }
      this._resetSilenceTimer();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      clearTimeout(this.silenceTimer);
      if (this.transcript.trim() && this.onResult) this.onResult(this.transcript.trim());
    };

    this.recognition.onerror = (e) => {
      this.isListening = false;
      clearTimeout(this.silenceTimer);
      if (this.onError) this.onError(e.error);
    };

    return true;
  },

  setLang(lang) { if (this.recognition) this.recognition.lang = lang; },

  start() {
    if (!this.recognition || this.isListening) return;
    this.transcript = '';
    this.isListening = true;
    try { this.recognition.start(); } catch (e) { this.isListening = false; }
  },

  stop() {
    if (!this.recognition || !this.isListening) return;
    clearTimeout(this.silenceTimer);
    this.recognition.stop();
    this.isListening = false;
  },

  _resetSilenceTimer() {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) this.recognition.stop();
    }, SILENCE_TIMEOUT);
  },
};

// ── VOICE OUTPUT ─────────────────────────────────────────────────
const VoiceOutput = {
  synth: window.speechSynthesis,
  isSpeaking: false,
  onEnd: null,

  get isSupported() { return 'speechSynthesis' in window; },

  isHindi(text) {
    return (text.match(/[\u0900-\u097F]/g) || []).length > text.length * 0.1;
  },

  getVoice(langPrefix) {
    const voices = this.synth.getVoices();
    // Prioritize natural/premium voices provided by Google or Edge
    const premium = voices.find(v => v.lang.startsWith(langPrefix) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')));
    return premium
      || voices.find(v => v.lang.startsWith(langPrefix))
      || voices.find(v => v.lang.startsWith('en'))
      || null;
  },

  speak(text, langOverride) {
    if (!this.isSupported) return;
    this.stop();

    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`(.*?)`/g, '$1')
      .substring(0, 500);

    const hindi = langOverride === 'hi' || this.isHindi(text);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = SPEECH_RATE;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    const voice = this.getVoice(hindi ? 'hi-IN' : 'en-IN');
    if (voice) utt.voice = voice;
    utt.lang = voice ? voice.lang : (hindi ? 'hi-IN' : 'en-IN');

    utt.onstart = () => { this.isSpeaking = true; };
    utt.onend = () => { this.isSpeaking = false; if (this.onEnd) this.onEnd(); };
    utt.onerror = () => { this.isSpeaking = false; if (this.onEnd) this.onEnd(); };

    this.synth.speak(utt);
    this.isSpeaking = true;
  },

  stop() {
    if (this.synth.speaking) this.synth.cancel();
    this.isSpeaking = false;
  },
};

// ── UI CONTROLLER ────────────────────────────────────────────────
const UI = {
  state: 'idle',
  lang: 'en',
  chatExpanded: false,
  messageCount: 0,
  toastTimer: null,
  els: {},

  init() {
    this.els = {
      orb:             document.getElementById('orbContainer'),
      orbIcon:         document.getElementById('orbIcon'),
      statusLabel:     document.getElementById('statusLabel'),
      statusHint:      document.getElementById('statusHint'),
      stopBtn:         document.getElementById('stopBtn'),
      chatContainer:   document.getElementById('chatContainer'),
      chatHeader:      document.querySelector('.chat-header'),
      chatMessages:    document.getElementById('chatMessages'),
      chatHeaderTitle: document.getElementById('chatHeaderTitle'),
      messagesInner:   document.getElementById('messagesInner'),
      emptyChat:       document.getElementById('emptyChat'),
      typingIndicator: document.getElementById('typingIndicator'),
      textInput:       document.getElementById('textInput'),
      sendBtn:         document.getElementById('sendBtn'),
      errorBanner:     document.getElementById('errorBanner'),
      errorText:       document.getElementById('errorText'),
      micPrompt:       document.getElementById('micPrompt'),
      infoModal:       document.getElementById('infoModal'),
      toast:           document.getElementById('toast'),
      langEn:          document.getElementById('langEn'),
      langHi:          document.getElementById('langHi'),
      topicsLabel:     document.getElementById('topicsLabel'),
    };
  },

  setLang(lang) {
    this.lang = lang;
    const L = LABELS[lang];
    this.els.statusLabel.textContent = L.statusIdle;
    this.els.statusHint.textContent = L.statusHint;
    this.els.chatHeaderTitle.textContent = L.chatHeader;
    this.els.textInput.placeholder = L.textPlaceholder;
    this.els.topicsLabel.textContent = L.topicsLabel;
    this.els.stopBtn.textContent = L.stopBtn;
    this.els.langEn.classList.toggle('active', lang === 'en');
    this.els.langHi.classList.toggle('active', lang === 'hi');
    this.els.langEn.setAttribute('aria-pressed', String(lang === 'en'));
    this.els.langHi.setAttribute('aria-pressed', String(lang === 'hi'));
    this.updateStateLabels();
  },

  setState(state) {
    this.state = state;
    this.els.orb.className = `orb-container state-${state}`;
    const icons = { idle: '🎤', listening: '🎙️', thinking: '⚙️', speaking: '🔊' };
    this.els.orbIcon.textContent = icons[state] || '🎤';
    this.els.stopBtn.classList.toggle('visible', state === 'speaking');
    this.els.sendBtn.disabled = state !== 'idle';
    this.updateStateLabels();
  },

  updateStateLabels() {
    const L = LABELS[this.lang];
    const map = {
      idle:      [L.statusIdle,      L.statusHint],
      listening: [L.statusListening, L.statusHintListen],
      thinking:  [L.statusThinking,  L.statusHintThink],
      speaking:  [L.statusSpeaking,  L.statusHintSpeak],
    };
    const [label, hint] = map[this.state] || [L.statusIdle, L.statusHint];
    this.els.statusLabel.textContent = label;
    this.els.statusHint.textContent = hint;
  },

  showError(msg) {
    this.els.errorText.textContent = msg;
    this.els.errorBanner.classList.add('visible');
    setTimeout(() => this.els.errorBanner.classList.remove('visible'), 6000);
  },

  showMicPrompt() { this.els.micPrompt.classList.add('visible'); },

  addMessage(role, text) {
    this.els.emptyChat.style.display = 'none';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = `message ${role}`;
    el.innerHTML = `
      <div class="msg-avatar">${role === 'user' ? '👤' : '🤖'}</div>
      <div>
        <div class="msg-bubble">${this.formatText(text)}</div>
        <span class="msg-time">${time}</span>
      </div>`;
    this.els.messagesInner.insertBefore(el, this.els.typingIndicator);
    this.messageCount++;
    if (role === 'assistant' && !this.chatExpanded) this.expandChat();
    this.els.chatMessages.scrollTop = this.els.chatMessages.scrollHeight;
  },

  formatText(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(0,212,255,0.1);padding:1px 4px;border-radius:3px;font-family:monospace">$1</code>')
      .replace(/\n/g, '<br>');
  },

  showTyping() {
    this.els.typingIndicator.classList.add('visible');
    if (!this.chatExpanded) this.expandChat();
    this.els.chatMessages.scrollTop = this.els.chatMessages.scrollHeight;
  },
  hideTyping() { this.els.typingIndicator.classList.remove('visible'); },

  toggleChat() { this.chatExpanded ? this.collapseChat() : this.expandChat(); },
  expandChat() {
    this.chatExpanded = true;
    this.els.chatContainer.classList.add('expanded');
    this.els.chatHeader.setAttribute('aria-expanded', 'true');
  },
  collapseChat() {
    this.chatExpanded = false;
    this.els.chatContainer.classList.remove('expanded');
    this.els.chatHeader.setAttribute('aria-expanded', 'false');
  },

  showToast(msg, ms = 2500) {
    clearTimeout(this.toastTimer);
    this.els.toast.textContent = msg;
    this.els.toast.classList.add('visible');
    this.toastTimer = setTimeout(() => this.els.toast.classList.remove('visible'), ms);
  },

  openModal() { this.els.infoModal.classList.add('visible'); this.els.infoModal.querySelector('.modal-close').focus(); },
  closeModal() { this.els.infoModal.classList.remove('visible'); },
};

// ── APP ──────────────────────────────────────────────────────────
const app = {
  lang: 'en',
  isProcessing: false,
  voiceSupported: false,

  async init() {
    UI.init();

    // Load voices
    if (VoiceOutput.isSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {};
    }

    // Init Gemini
    try {
      GeminiChat.init();
    } catch (e) {
      UI.showError('API key missing. Add VITE_GEMINI_API_KEY to .env and restart npm run dev.');
      console.error(e);
    }

    // Init voice recognition
    this.voiceSupported = VoiceInput.init('en-IN');
    if (this.voiceSupported) {
      VoiceInput.onResult = (t) => this.onVoiceResult(t);
      VoiceInput.onError = (e) => this.onVoiceError(e);
    } else {
      UI.showToast('Voice input not supported in this browser — use Chrome or Edge.');
    }

    VoiceOutput.onEnd = () => { if (UI.state === 'speaking') UI.setState('idle'); };

    this.setLang('en');

    setTimeout(() => { if (UI.messageCount === 0) this._sendWelcome(); }, 800);
  },

  async _sendWelcome() {
    const msg = this.lang === 'hi'
      ? 'नमस्ते! मैं GEC खगड़िया का AI सहायक हूँ। दाखिला, हॉस्टल, लैब, खेल या कॉलेज की कोई भी जानकारी पूछें। बोलने के लिए गोले को टैप करें!'
      : 'Hi! I\'m the AI guide for GEC Khagaria — inaugurated by CM Nitish Kumar in Jan 2023. Ask me anything about admission, hostel, labs, Fusion Utsav, or any college info. Tap the orb to speak, or type below!';
    UI.addMessage('assistant', msg);
    if (VoiceOutput.isSupported) { UI.setState('speaking'); VoiceOutput.speak(msg, this.lang); }
  },

  toggleVoice() {
    if (!this.voiceSupported) { UI.showMicPrompt(); return; }
    if (UI.state === 'listening') { VoiceInput.stop(); UI.setState('idle'); return; }
    if (UI.state === 'speaking') { this.stopSpeaking(); return; }
    if (UI.state === 'thinking') return;
    UI.setState('listening');
    VoiceInput.start();
  },

  onVoiceResult(t) { if (!t) { UI.setState('idle'); return; } this.processQuery(t); },

  onVoiceError(error) {
    UI.setState('idle');
    const L = LABELS[this.lang];
    if (error === 'not-allowed' || error === 'permission-denied') { UI.showMicPrompt(); UI.showError(L.errorMicDenied); }
    else if (error === 'no-speech') UI.showToast(L.errorNoSpeech);
  },

  sendText() {
    const input = UI.els.textInput;
    const text = input.value.trim();
    if (!text || this.isProcessing) return;
    input.value = '';
    this.processQuery(text);
  },

  askTopic(key) {
    if (this.isProcessing) return;
    const q = (TOPIC_QUESTIONS[this.lang] || TOPIC_QUESTIONS.en)[key];
    if (q) this.processQuery(q);
  },

  async processQuery(userText) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    VoiceOutput.stop();
    UI.addMessage('user', userText);
    UI.setState('thinking');
    UI.showTyping();

    try {
      const response = await GeminiChat.send(userText);
      UI.hideTyping();
      UI.addMessage('assistant', response);
      if (VoiceOutput.isSupported) { UI.setState('speaking'); VoiceOutput.speak(response, this.lang); }
      else UI.setState('idle');
    } catch (err) {
      UI.hideTyping();
      UI.setState('idle');
      const L = LABELS[this.lang];
      const is429 = err.message?.includes('429') || err.status === 429;
      const msg = is429 ? L.rateLimit : `${L.errorApi} (${err.message})`;
      UI.addMessage('assistant', `⚠️ ${msg}`);
      UI.showError(msg);
      console.error('Gemini error:', err);
    } finally {
      this.isProcessing = false;
    }
  },

  setLang(lang) {
    this.lang = lang;
    UI.setLang(lang);
    VoiceInput.setLang(lang === 'hi' ? 'hi-IN' : 'en-IN');
  },

  stopSpeaking() { VoiceOutput.stop(); UI.setState('idle'); },
  toggleChat() { UI.toggleChat(); },
  openModal() { UI.openModal(); },
  closeModal() { UI.closeModal(); },
};

// ── BOOT ─────────────────────────────────────────────────────────
window.app = app; // expose for HTML onclick handlers
document.addEventListener('DOMContentLoaded', () => app.init().catch(console.error));
