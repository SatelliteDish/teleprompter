'use client';
import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function Home() {
  // Speech Recognition Hooks
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Animation State
  const [isPartyTime, setIsPartyTime] = useState(false);

  // Watch For the Magic Word
  useEffect(() => {
    const spokenText = transcript?.toLowerCase() ?? "";
    if (spokenText.includes('butts')) {
      triggerPartyMode();
    }
  }, [transcript]);

  const triggerPartyMode = () => {
    if (isPartyTime) return; // Prevent multiple triggers
    setIsPartyTime(true);

    // Clear the transcript so we don't retrigger
    resetTranscript();

    // stop the party of 10 seconds
    setTimeout(() => {
      setIsPartyTime(false);
    }, 10000);
  };

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


  /* return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>To get started, edit the page.tsx file.</h1>
          <p>
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className={styles.secondary}
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  ); 
} */
