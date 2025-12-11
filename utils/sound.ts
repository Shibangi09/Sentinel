let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

export const playAlarm = () => {
  initAudioContext();
  if (!audioContext) return;

  // If already playing, don't overlap
  if (oscillator) return;

  const now = audioContext.currentTime;

  // Create oscillator
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(880, now); // A5
  oscillator.frequency.setValueAtTime(1760, now + 0.1); // A6
  oscillator.frequency.setValueAtTime(880, now + 0.2); // A5

  // Connect
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Beep pattern: Beep-Beep-Beep
  // We modulate gain to create pulses
  gainNode.gain.setValueAtTime(0, now);
  
  // First beep
  gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, now + 0.2);

  // Second beep
  gainNode.gain.linearRampToValueAtTime(0.5, now + 0.3);
  gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

  // Third beep
  gainNode.gain.linearRampToValueAtTime(0.5, now + 0.6);
  gainNode.gain.linearRampToValueAtTime(0, now + 0.8);

  // Start immediately
  oscillator.start(now);
  
  // Loop by recreating effectively or just let the oscillator run if we wanted continuous
  // But requirement is "play a sound... for a maximum of three seconds"
  // We will loop this pattern using the interval in the main component, 
  // or we can make the oscillator loop here. 
  // Let's make a simple continuous alert tone that pulses.
  
  oscillator.stop(now + 3); // Hard stop after 3s as per requirement safety
  
  // Clean up after stop
  oscillator.onended = () => {
    oscillator = null;
    gainNode = null;
  };
};

export const stopAlarm = () => {
  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {
      console.error("Error stopping oscillator", e);
    }
    oscillator = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
};
