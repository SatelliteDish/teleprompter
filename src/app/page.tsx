  /* eslint-disable react-hooks/set-state-in-effect */
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { io, Socket } from 'socket.io-client';
export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // Speech Recognition Hooks
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  // Animation State
  const [isPartyTime, setIsPartyTime] = useState(false);

  // Deepgram fallback state
  const [useDeepgram, setUseDeepgram] = useState(false);
  const [deepgramTranscript, setDeepgramTranscript] = useState('');
  const [deepgramInterimTranscript, setDeepgramInterimTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set mounted state on initial load
  useEffect(() => {
    setHasMounted(true);
  }, []);


  // Check to see if the Speech Recognition API is available
  useEffect(() => {
    const checkAvailability = async () => {
      let isBrave = false;

      // Detect Brave browser
      if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
        isBrave = await (navigator as any).brave.isBrave();
      }
      setUseDeepgram(!browserSupportsSpeechRecognition || isBrave)
    };
    checkAvailability();
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    // Connect to our server
    const socket = io();
    socketRef.current = socket;
    // Listen for party trigger from server
    socket.on("trigger_party", () => {
      setIsPartyTime(true);
      setTimeout(() => {
        setIsPartyTime(false);
      }, 10000);
    });
    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [])

  // Deepgram toggle handler
  const handleTranscriptionToggle = async () => {
    if (isTranscribing) {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      deepgramSocketRef.current?.close();
      setIsTranscribing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });
        mediaRecorderRef.current = mediaRecorder;

        const params = new URLSearchParams({
          model: 'nova-2',
          interim_results: 'true',  // Get partial results immediately
          smart_format: 'true',  // Better formatting
          punctuate: 'true'
        });

        const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
        if (!deepgramKey) {
          throw new Error("Requires Deepgram API key");
        }

        const socket = new WebSocket(
          `wss://api.deepgram.com/v1/listen?${params}`,
          ['token', deepgramKey]
        );
        deepgramSocketRef.current = socket;

        socket.onopen = () => {
          console.log('Connected to Deepgram');

          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          });

          // Send audio every 100ms for lower latency
          mediaRecorder.start(100);
        };

        socket.onmessage = (message) => {
          const received = JSON.parse(message.data);
          const result = received.channel?.alternatives?.[0]?.transcript;

          if (result) {
            if (received.is_final) {
              // Add finalized transcript and clear interim
              setDeepgramTranscript((prev) => prev + ' ' + result);
              setDeepgramInterimTranscript('');
            } else {
              // Show interim result immediately
              setDeepgramInterimTranscript(result);
            }
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
          console.log('WebSocket closed');
        };

        setIsTranscribing(true);
      } catch (err) {
        console.error('Failed to start transcription:', err);
      }
    }
  };

  // Watch For the Magic Word
  useEffect(() => {
    const activeTranscript = useDeepgram ? deepgramTranscript : transcript;
    if (!activeTranscript || isPartyTime) return;

    const spokenText = activeTranscript?.toLowerCase() ?? "";

    if (spokenText.includes('butts') && !isPartyTime) {
      console.log("Butts Spoken! Notifying Server...");
      socketRef.current?.emit("butts_spoken");
      if (!useDeepgram) {
        resetTranscript();
      } else {
        setDeepgramTranscript('');
        setDeepgramInterimTranscript('');
      }
    }
  }, [isPartyTime, resetTranscript, transcript, deepgramTranscript, browserSupportsSpeechRecognition, useDeepgram]);

  // --- RENDERING ---
  if (!hasMounted) return null;

  return (
    <div className="App">
      <header className={"App-header"}>
        <p>Microphone: {useDeepgram ? (isTranscribing ? 'on' : 'off') : (listening ? 'on' : 'off')}</p>
        {!listening && (
          <button onClick={() => useDeepgram? handleTranscriptionToggle() : SpeechRecognition.startListening({continuous: true})}>
            Start Listening
          </button>
        )}
      </header>
      <h1 className={`target-word ${isPartyTime ? 'party-time' : ''}`}>
        Butts
      </h1>
      {/*
        Debugger, wtf am I saying
      */}
      <p>
        You Said: {useDeepgram? deepgramTranscript : transcript}
        {deepgramInterimTranscript && (
          <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
            {deepgramTranscript && ' '}
            {deepgramInterimTranscript}
          </span>
        )}
      </p>
    </div>
  );
}
