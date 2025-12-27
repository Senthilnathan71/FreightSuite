import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  private recognition: any;
  private isListening = false;
  private continuousListening = false;
  private navigationMode = false;
  
  // Events for navigation
  public navigationCommand = new Subject<string>();
  public fieldFocusCommand = new Subject<string>();
  public voiceInputComplete = new Subject<string>();
  
  // Observable for listening state
  public listeningState = new BehaviorSubject<boolean>(false);
  
  // Navigation commands
  private navigationCommands = [
    'next', 'previous', 'skip', 'forward', 'back', 
    'stop', 'pause', 'continue', 'clear', 'select',
    'open', 'close', 'submit', 'save', 'reset'
  ];

  constructor(private toastr: ToastrService) {
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return;
  }

  this.recognition = new SpeechRecognition();
  this.recognition.lang = 'en-US';
  this.recognition.continuous = true;
  this.recognition.interimResults = true;
  this.recognition.maxAlternatives = 3;

  this.recognition.onstart = () => {
    this.isListening = true;
    this.listeningState.next(true);
    console.log('🎤 Recognition started');
  };

  // ✅ ONLY ONE onresult — KEEP THIS
  this.recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += text;
      } else {
        interimTranscript += text;
      }
    }

    if (interimTranscript) {
      console.log('⏳ Interim:', interimTranscript);
    }

    if (finalTranscript) {
      console.log('🎤 Final:', finalTranscript);
      this.processVoiceInput(finalTranscript.toLowerCase().trim());
    }
  };

  this.recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
  };

  this.recognition.onend = () => {
    this.isListening = false;
    this.listeningState.next(false);

    if (this.continuousListening) {
      setTimeout(() => {
        if (!this.isListening) {
          this.startContinuous();
        }
      }, 300);
    }
  };
}


 private processVoiceInput(transcript: string): void {
  console.log('🎤 Final Voice Transcript:', transcript);

  const isNavigation = this.navigationCommands.some(cmd =>
    transcript.includes(cmd)
  );

  if (isNavigation) {
    console.log('➡️ Navigation Command Detected:', transcript);
    this.navigationCommand.next(transcript);
  } else {
    console.log('📝 Field Input Detected:', transcript);
    this.voiceInputComplete.next(transcript);
  }
}


    startContinuous(): void {
    if (!this.recognition) return;

    // ✅ HARD GUARD — THIS FIXES THE ERROR
    if (this.isListening) {
      console.warn('SpeechRecognition already started');
      return;
  }

  this.continuousListening = true;
  this.recognition.continuous = true;
  this.recognition.interimResults = true;

  try {
    this.recognition.start();
  } catch (error) {
    console.error('Error starting voice recognition:', error);
  }
}



  startSingle(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('Speech recognition not supported');
        return;
      }

      const tempRecognition = new (window as any).SpeechRecognition();
      tempRecognition.lang = 'en-US';
      tempRecognition.continuous = false;
      tempRecognition.interimResults = false;
      tempRecognition.maxAlternatives = 1;

      tempRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript.toLowerCase());
      };

      tempRecognition.onerror = (event: any) => {
        reject(event.error);
      };

      try {
        tempRecognition.start();
      } catch (error) {
        reject('Unable to start voice recognition');
      }
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.continuousListening = false;
    }
  }

  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startContinuous();
    }
  }

  isSupported(): boolean {
    return !!(window as any).SpeechRecognition || 
           !!(window as any).webkitSpeechRecognition;
  }

  getNavigationCommands(): string[] {
    return this.navigationCommands;
  }

  get isContinuous(): boolean {
    return this.continuousListening;
  }
  // startListening(continuous: boolean = false): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     if (!this.recognition) {
  //       reject('Speech recognition not supported');
  //       return;
  //     }

  //     this.continuousListening = continuous;
      
  //     if (continuous) {
  //       this.recognition.continuous = true;
  //       this.recognition.interimResults = true;
  //     } else {
  //       this.recognition.continuous = false;
  //       this.recognition.interimResults = false;
  //     }

  //     this.recognition.onresult = (event: any) => {
  //       if (!continuous) {
  //         const transcript = event.results[0][0].transcript;
  //         this.isListening = false;
  //         resolve(transcript.toLowerCase());
  //       }
  //       // For continuous mode, you'll need to handle results differently
  //     };

  //     // ... rest of existing code
  //   });
  // }
}