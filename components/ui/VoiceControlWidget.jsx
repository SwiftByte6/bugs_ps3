"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import Badge from "./Badge";
import {
  Mic,
  MicOff,
  Square,
  XCircle,
  Volume2,
  Sparkles,
  HelpCircle,
  Send,
  Bot,
  User,
  RefreshCw,
} from "lucide-react";
import { executeVoiceCommand, transcribeAudio } from "@/lib/services/voiceService";

export default function VoiceControlWidget({ onCommandExecute }) {
  // Voice States: 
  // 'idle' | 'listening_wake_word' | 'assistant_activated' | 'listening_command' | 'processing_command' | 'executing_action' | 'responding' | 'error' | 'cancelled'
  const [voiceState, setVoiceState] = useState("listening_wake_word");
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState('Listening for: "Please guide me"');
  const [announcement, setAnnouncement] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [useFasterWhisperBackend, setUseFasterWhisperBackend] = useState(false);

  // Conversation history for 2-way communication
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: 'Saarthi Voice Companion active. Say "Please guide me" or click below to start.',
    },
  ]);

  const recognitionRef = useRef(null);
  const stateRef = useRef(voiceState);
  const latestTranscriptRef = useRef(""); // Mutable ref to prevent React state closure bug
  const silenceTimerRef = useRef(null); // Pause VAD timer matching Faster-Whisper min_silence_duration_ms
  const messagesEndRef = useRef(null);
  const audioCtxRef = useRef(null);

  // MediaRecorder for direct Faster-Whisper backend audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Keep stateRef updated for callbacks
  useEffect(() => {
    stateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Pre-load voices for Chrome/Edge
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Web Audio API Activation Chime
  const playActivationChime = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  const announce = (text) => {
    setAnnouncement(text);
    playActivationChime();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const preferredVoice =
            voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Direct"))) ||
            voices.find((v) => v.lang.startsWith("en")) ||
            voices[0];
          if (preferredVoice) utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.warn("Speech synthesis error event:", e);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
  };

  const isWakeWord = (text) => {
    if (!text) return false;
    const clean = text.toLowerCase().replace(/[^\w\s]/g, "").trim();
    return (
      clean.includes("please guide me") ||
      clean === "please guide me" ||
      clean.includes("guide me") ||
      clean.startsWith("please guide")
    );
  };

  // Safe restart to prevent InvalidStateError
  const safeRestartRecognition = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.abort();
    } catch (e) {}

    setTimeout(() => {
      try {
        latestTranscriptRef.current = "";
        recognitionRef.current.start();
      } catch (e) {
        console.warn("SpeechRecognition start failed:", e);
      }
    }, 150);
  };

  const startListening = () => {
    latestTranscriptRef.current = "";
    setTranscript("");
    setCustomInput("");
    safeRestartRecognition();
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
  };

  // Setup Web Speech API and MediaRecorder fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          if (stateRef.current === "listening_wake_word") {
            setStatusMessage('Listening for: "Please guide me"');
          } else if (stateRef.current === "listening_command") {
            setStatusMessage("Listening for your request...");
          }
        };

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }

          const trimmed = currentTranscript.trim();
          latestTranscriptRef.current = trimmed;
          setTranscript(trimmed);
          
          // Live display in text bar input box as user speaks
          setCustomInput(trimmed);

          // VAD pause detection (500ms silence threshold)
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          if (stateRef.current === "listening_wake_word") {
            if (isWakeWord(trimmed)) {
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              latestTranscriptRef.current = "";
              try { recognition.abort(); } catch (e) {}
              handleWakeWordDetected();
            }
          } else if (stateRef.current === "listening_command") {
            // Once user pauses speaking for 500ms, auto-stop & process command
            silenceTimerRef.current = setTimeout(() => {
              if (stateRef.current === "listening_command" && latestTranscriptRef.current.trim()) {
                try { recognition.abort(); } catch (e) {}
                const commandText = latestTranscriptRef.current.trim();
                latestTranscriptRef.current = "";
                handleProcessCommand(commandText);
              }
            }, 500);
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setVoiceState("error");
            setStatusMessage("Microphone permission denied. Click 'Faster-Whisper STT' or use text.");
          } else if (event.error !== "aborted") {
            if (stateRef.current === "listening_wake_word" || stateRef.current === "listening_command") {
              setTimeout(() => {
                if (stateRef.current === "listening_wake_word" || stateRef.current === "listening_command") {
                  safeRestartRecognition();
                }
              }, 400);
            }
          }
        };

        recognition.onend = () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          const currentState = stateRef.current;
          const rawText = (latestTranscriptRef.current || "").trim();
          latestTranscriptRef.current = "";

          if (currentState === "listening_wake_word") {
            if (isWakeWord(rawText)) {
              handleWakeWordDetected();
            } else {
              setTimeout(() => {
                if (stateRef.current === "listening_wake_word") {
                  safeRestartRecognition();
                }
              }, 300);
            }
          } else if (currentState === "listening_command") {
            if (rawText) {
              handleProcessCommand(rawText);
            } else {
              setTimeout(() => {
                if (stateRef.current === "listening_command") {
                  safeRestartRecognition();
                }
              }, 500);
            }
          }
        };

        recognitionRef.current = recognition;

        safeRestartRecognition();
      }
    }

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        toggleListening();
      } else if (e.key === "Escape") {
        handleStopAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // Record mic audio directly to Faster-Whisper backend endpoint (/api/voice/transcribe)
  const recordAndTranscribeWithFasterWhisper = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      setStatusMessage("Recording audio for Faster-Whisper backend...");
      setVoiceState("listening_command");

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setStatusMessage("Transcribing via Faster-Whisper CPU backend...");
        setVoiceState("processing_command");

        const result = await transcribeAudio(audioBlob);
        const text = result.data?.transcript || result.transcript || "";

        if (text) {
          setCustomInput(text);
          setTranscript(text);
          if (isWakeWord(text)) {
            handleWakeWordDetected();
          } else {
            handleProcessCommand(text);
          }
        } else {
          setStatusMessage("No speech recognized by Faster-Whisper.");
          setVoiceState("listening_wake_word");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Auto stop after 4 seconds of recording
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 4000);
    } catch (e) {
      console.error("Faster-Whisper microphone error:", e);
      setStatusMessage("Microphone capture failed. Please use text input.");
      setVoiceState("error");
    }
  };

  const handleWakeWordDetected = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setVoiceState("assistant_activated");
    const reply = "Yes, how can I help you?";
    setStatusMessage(`Assistant activated: "${reply}"`);
    setCustomInput("");

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: "Please guide me" },
      { sender: "assistant", text: reply },
    ]);

    announce(reply);

    setTimeout(() => {
      setVoiceState("listening_command");
      setStatusMessage("Listening for your request...");
      latestTranscriptRef.current = "";
      setTranscript("");
      setCustomInput("");
      safeRestartRecognition();
    }, 2200);
  };

  const handleProcessCommand = async (text) => {
    if (!text || !text.trim()) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setVoiceState("processing_command");
    setStatusMessage(`Understanding request: "${text}"...`);
    setCustomInput("");

    setMessages((prev) => [...prev, { sender: "user", text }]);

    try {
      setVoiceState("executing_action");
      setStatusMessage("Executing agent action...");

      const result = await executeVoiceCommand(text, {
        current_page: typeof window !== "undefined" ? window.location.pathname : "/dashboard",
      });

      const data = result.data || {};
      const responseText = data.response_text || data.speech_announcement || `Executed: ${text}`;

      setVoiceState("responding");
      setStatusMessage(responseText);

      setMessages((prev) => [...prev, { sender: "assistant", text: responseText }]);

      announce(responseText);

      if (onCommandExecute) {
        onCommandExecute(data);
      }

      setTimeout(() => {
        setVoiceState("listening_wake_word");
        setStatusMessage('Listening for: "Please guide me"');
        latestTranscriptRef.current = "";
        setTranscript("");
        setCustomInput("");
        safeRestartRecognition();
      }, 5000);
    } catch (err) {
      console.error("Voice command execution error:", err);
      setVoiceState("error");
      const errMsg = "I didn't quite catch that. Please try again.";
      setStatusMessage(errMsg);
      setMessages((prev) => [...prev, { sender: "assistant", text: errMsg }]);
      announce(errMsg);

      setTimeout(() => {
        setVoiceState("listening_wake_word");
        setStatusMessage('Listening for: "Please guide me"');
        safeRestartRecognition();
      }, 3000);
    }
  };

  const toggleListening = () => {
    if (voiceState === "idle" || voiceState === "cancelled" || voiceState === "error") {
      setVoiceState("listening_wake_word");
      setStatusMessage('Listening for: "Please guide me"');
      startListening();
    } else {
      handleStopAll();
    }
  };

  const handleStopAll = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    stopListening();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setVoiceState("cancelled");
    setStatusMessage("Voice action cancelled.");
    announce("Voice action stopped.");
    setTimeout(() => {
      setVoiceState("listening_wake_word");
      setStatusMessage('Listening for: "Please guide me"');
      safeRestartRecognition();
    }, 2000);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const text = customInput.trim();
    setCustomInput("");

    if (isWakeWord(text)) {
      handleWakeWordDetected();
    } else if (voiceState === "listening_command" || voiceState === "assistant_activated") {
      handleProcessCommand(text);
    } else {
      handleWakeWordDetected();
      setTimeout(() => {
        handleProcessCommand(text);
      }, 2300);
    }
  };

  const handleTestAudio = () => {
    announce("Audio unmuted. Yes, how can I help you?");
  };

  return (
    <div className="bg-white border border-[#E2E2E5] shadow-xl rounded-2xl p-4 space-y-3 w-full max-w-sm select-none">
      {/* Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E5]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F1EBFF] text-[#40189D] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-[#40189D]" />
          </div>
          <span className="font-bold text-xs text-[#222222]">Saarthi 2-Way Voice</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTestAudio}
            title="Test audio speech & chime"
            className="p-1 px-2 text-[10px] font-bold rounded-md bg-[#F1EBFF] text-[#40189D] hover:bg-purple-200 border border-purple-300 flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3" />
            <span>Test Audio</span>
          </button>

          <Badge
            variant={
              voiceState === "listening_wake_word"
                ? "default"
                : voiceState === "assistant_activated" || voiceState === "listening_command"
                ? "warning"
                : voiceState === "processing_command" || voiceState === "executing_action"
                ? "primary"
                : voiceState === "responding"
                ? "success"
                : voiceState === "error"
                ? "danger"
                : "default"
            }
            size="sm"
          >
            {voiceState === "listening_wake_word"
              ? 'Listening for "Please guide me"'
              : voiceState === "assistant_activated"
              ? "Activated"
              : voiceState === "listening_command"
              ? "Listening..."
              : voiceState === "processing_command"
              ? "Understanding..."
              : voiceState === "executing_action"
              ? "Executing..."
              : voiceState === "responding"
              ? "Responding"
              : voiceState === "error"
              ? "Error"
              : voiceState === "cancelled"
              ? "Cancelled"
              : "Idle"}
          </Badge>
        </div>
      </div>

      {/* 2-Way Conversation Chat Stream */}
      <div className="bg-[#F5F5F6] border border-[#E2E2E5] rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              m.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                m.sender === "user"
                  ? "bg-[#40189D] text-white"
                  : "bg-purple-200 text-[#40189D]"
              }`}
            >
              {m.sender === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            </div>
            <div
              className={`p-2 rounded-lg max-w-[82%] font-medium leading-tight ${
                m.sender === "user"
                  ? "bg-[#40189D] text-white"
                  : "bg-white border border-[#E2E2E5] text-[#222222]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Live Transcript Preview */}
      {transcript && (
        <div className="p-2 rounded-xl bg-[#F1EBFF] border border-purple-200 text-xs font-semibold text-[#40189D] flex items-center gap-2 animate-in fade-in">
          <Mic className="w-3.5 h-3.5 text-[#40189D] animate-pulse shrink-0" />
          <span className="italic">"{transcript}"</span>
        </div>
      )}

      {/* Dynamic Status Display */}
      <div className="p-2.5 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] text-xs text-[#222222] font-medium flex items-center justify-between min-h-[40px]">
        <span className="line-clamp-2 font-semibold text-[11px]">{statusMessage}</span>
        {isSpeaking && <Volume2 className="w-4 h-4 text-[#40189D] animate-pulse shrink-0 ml-2" />}
      </div>

      {/* Quick Trigger Wake Phrase & Faster-Whisper Buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleWakeWordDetected}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#F1EBFF] border border-purple-300 text-[#40189D] hover:bg-purple-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#40189D]" />
            <span>Trigger "Please guide me"</span>
          </button>

          <button
            onClick={recordAndTranscribeWithFasterWhisper}
            title="Record mic and transcribe using backend Faster-Whisper model"
            className="py-1.5 px-2.5 rounded-xl bg-[#40189D] text-white hover:bg-[#32127A] text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shrink-0"
          >
            <Mic className="w-3 h-3 text-white animate-pulse" />
            <span>Faster-Whisper STT</span>
          </button>
        </div>

        {/* Action Prompt Suggestions */}
        {(voiceState === "listening_command" || voiceState === "assistant_activated") && (
          <div className="flex flex-wrap gap-1 pt-1 animate-in fade-in">
            <button
              onClick={() => handleProcessCommand("Find frontend jobs suitable for my profile.")}
              className="text-[10px] bg-white border border-purple-300 hover:bg-purple-100 text-[#40189D] px-2 py-1 rounded-md font-medium"
            >
              "Find frontend jobs..."
            </button>
            <button
              onClick={() => handleProcessCommand("Explain this job requirement.")}
              className="text-[10px] bg-white border border-purple-300 hover:bg-purple-100 text-[#40189D] px-2 py-1 rounded-md font-medium"
            >
              "Explain this job requirement"
            </button>
            <button
              onClick={() => handleProcessCommand("Help me apply for this job.")}
              className="text-[10px] bg-white border border-purple-300 hover:bg-purple-100 text-[#40189D] px-2 py-1 rounded-md font-medium"
            >
              "Help me apply for this job"
            </button>
          </div>
        )}
      </div>

      {/* Live Input Text Bar — Displays spoken words live as user speaks */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 pt-1">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={
            voiceState === "listening_command"
              ? "Speaking... (Auto-stops on pause)"
              : 'Type "Please guide me" or speak...'
          }
          className="flex-1 px-3 py-1.5 text-xs border border-[#E2E2E5] rounded-xl focus:outline-none focus:border-[#40189D] font-medium transition-colors"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-[#40189D] text-white hover:bg-[#32127A] transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Main Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          variant="primary"
          size="md"
          icon={voiceState.startsWith("listening") ? MicOff : Mic}
          onClick={toggleListening}
          className={`flex-1 font-bold text-xs ${
            voiceState.startsWith("listening")
              ? "bg-amber-600 hover:bg-amber-700 animate-pulse"
              : "bg-[#40189D] hover:bg-[#32127A]"
          }`}
        >
          {voiceState === "listening_wake_word"
            ? 'Listening for "Please guide me"'
            : voiceState === "listening_command"
            ? "Listening for request..."
            : "Start Voice (Press V)"}
        </Button>

        <button
          onClick={handleStopAll}
          aria-label="Stop active voice speech and listening"
          title="Stop speech & cancel command (Esc)"
          className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center shrink-0 font-bold"
        >
          <Square className="w-3.5 h-3.5 fill-[#991B1B]" />
        </button>

        <button
          onClick={() => setShowHelp(!showHelp)}
          aria-label="Supported voice commands help"
          className="p-2 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] text-[#40189D] hover:bg-purple-100 transition-colors flex items-center justify-center shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cheat Sheet */}
      {showHelp && (
        <div className="p-2.5 rounded-xl bg-[#F1EBFF] border border-purple-200 text-xs space-y-1 animate-in fade-in">
          <span className="font-bold text-[#40189D] block mb-1">
            2-Way Voice Instructions:
          </span>
          <ul className="space-y-0.5 text-[#40189D] font-medium text-[11px]">
            <li>1. Say or click <strong>"Please guide me"</strong></li>
            <li>2. Saarthi speaks: <strong>"Yes, how can I help you?"</strong></li>
            <li>3. Speak your request (words display live in text bar)</li>
            <li>4. Or click <strong>"Faster-Whisper STT"</strong> to record directly to backend</li>
          </ul>
        </div>
      )}
    </div>
  );
}
