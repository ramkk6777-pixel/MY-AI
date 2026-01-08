
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient, encodeAudio, decodeAudio, decodeAudioData } from '../services/gemini';
import { Modality, LiveServerMessage } from '@google/genai';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const stopLive = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    for (const source of sourcesRef.current) {
      source.stop();
    }
    sourcesRef.current.clear();
    setIsActive(false);
  };

  const startLive = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = getGeminiClient();

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      audioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodeAudio(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcriptions
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              setTranscript(prev => [
                ...prev, 
                { role: 'user', text: currentInputTranscription.current },
                { role: 'model', text: currentOutputTranscription.current }
              ]);
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(
                decodeAudio(base64Audio),
                outputAudioContext,
                24000,
                1
              );
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setError("Connection error. Please try again.");
            stopLive();
          },
          onclose: () => {
            stopLive();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a helpful companion in a live voice conversation. Keep responses concise and human-like.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to access microphone or connect to Gemini.");
    }
  };

  useEffect(() => {
    return () => stopLive();
  }, []);

  return (
    <div className="h-full flex flex-col p-6 items-center justify-center max-w-4xl mx-auto w-full">
      <div className="text-center space-y-8 w-full">
        <div className="relative">
          <div className={`w-40 h-40 md:w-56 md:h-56 mx-auto rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl ${
            isActive ? 'bg-rose-500 scale-110 shadow-rose-500/30' : 'bg-slate-800 shadow-slate-950/50 border border-slate-700'
          }`}>
            <i className={`fa-solid ${isActive ? 'fa-microphone text-6xl md:text-8xl' : 'fa-microphone-slash text-6xl md:text-7xl'} text-white`}></i>
            {isActive && (
              <div className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-25"></div>
            )}
            {isActive && (
              <div className="absolute inset-0 rounded-full border border-rose-400 animate-pulse opacity-50 scale-125"></div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {isActive ? "Listening and Speaking..." : "Connect Live with Gemini"}
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
            {isActive 
              ? "Gemini is ready for natural, zero-latency conversation. Just start talking!" 
              : "Experience ultra-low latency voice chat. Gemini can understand your tone and speak back humanly."}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-3 rounded-2xl flex items-center gap-3 justify-center">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <button
          onClick={isActive ? stopLive : startLive}
          className={`px-12 py-5 rounded-full text-xl font-bold transition-all transform active:scale-95 shadow-2xl flex items-center gap-4 mx-auto ${
            isActive 
              ? 'bg-slate-800 hover:bg-slate-700 text-white' 
              : 'bg-rose-600 hover:bg-rose-500 text-white hover:shadow-rose-600/20'
          }`}
        >
          {isActive ? (
            <>
              <i className="fa-solid fa-stop"></i>
              <span>Stop Session</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-play"></i>
              <span>Start Conversation</span>
            </>
          )}
        </button>

        {transcript.length > 0 && (
          <div className="mt-12 text-left bg-slate-800/50 rounded-3xl p-6 border border-slate-700 max-h-64 overflow-y-auto w-full backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-closed-captioning"></i>
              Live Transcript
            </h3>
            <div className="space-y-4">
              {transcript.map((entry, idx) => (
                <div key={idx} className={`flex gap-3 ${entry.role === 'user' ? 'text-blue-400' : 'text-slate-200'}`}>
                  <span className="font-bold text-[10px] uppercase w-12 pt-1">{entry.role}:</span>
                  <p className="flex-1 text-sm leading-relaxed">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveView;
