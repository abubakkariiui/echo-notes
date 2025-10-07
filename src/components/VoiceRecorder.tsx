'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255);
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      analyzeAudio();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
              : 'bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'shadow-2xl hover:scale-105'}`}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isRecording ? (
              <rect x="6" y="6" width="8" height="8" rx="1" />
            ) : (
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </motion.button>

        {/* Pulsing rings animation */}
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5 + audioLevel * 0.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8 + audioLevel * 0.7, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"
              />
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center space-y-2">
        <p className="text-2xl font-bold text-gray-800">
          {isRecording ? formatDuration(duration) : 'Ready to record'}
        </p>
        <p className="text-gray-500">
          {isRecording ? 'Recording... Click to stop' : 'Click the microphone to start'}
        </p>
      </div>

      {/* Waveform visualization */}
      {isRecording && (
        <div className="flex items-center space-x-1 h-16">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full"
              animate={{
                height: [
                  Math.random() * 20 + 10,
                  Math.random() * 40 + 20 + audioLevel * 40,
                  Math.random() * 20 + 10,
                ],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

