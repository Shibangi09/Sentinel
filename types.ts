export interface DrowsinessAnalysisResult {
  isDrowsy: boolean;
  reason: string;
  confidence: number;
  detectedSigns: string[];
}

export enum DetectionStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  ALERT = 'ALERT',
  ERROR = 'ERROR'
}
