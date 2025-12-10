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
  // Set mounted state on initial load
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  // Watch For the Magic Word
  useEffect(() => {
    if (!transcript || isPartyTime) return;
    const spokenText = transcript?.toLowerCase() ?? "";
    if (spokenText.includes('butts') && !isPartyTime) {
      console.log("Butts Spoken! Notifying Server...");
      socketRef.current?.emit("butts_spoken");
      resetTranscript();
    }
  }, [isPartyTime, resetTranscript, transcript]);

  // --- RENDERING ---
  if (!hasMounted) return null;

  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser does not support speech recognition.  Try Chrome.</span>;
  }

  return (
    <div className="App">
      <header className={"App-header"}>
      <p>Microphone: {listening ? 'on' : 'off'}</p>
      {!listening && (
        <button onClick={() => SpeechRecognition.startListening({continuous: true})}>Start Listening</button>
      )}
      </header>
      <h1 className={`target-word ${isPartyTime ? 'party-time' : ''}`}>
        Butts  
      </h1>
      {/*
        Debugger, wtf am I saying
      */}
      <p>
        You Said: {transcript}
      </p>
    </div>
  );
}