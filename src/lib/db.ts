import Dexie, { type EntityTable } from 'dexie';

export interface AudioDraft {
  id: string;
  name: string;
  blob: Blob;
  durationMs: number;
  tags?: string[];
  createdAt: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  sourceAudioId?: string;
  baseStyleId?: string;
  createdAt: number;
}

export interface VoiceStyleTemplate {
  id: string;
  name: string;
  pitch: number;
  speed: number;
  emotion: string;
}

export interface SpeechDiagnosisReport {
  id: string;
  profileId: string;
  clarityScore: number;
  pitchVariation: number[];
  speedVariation: number[];
  volumeVariation: number[];
  diarizationSegments: DiarizationSegment[];
  createdAt: number;
}

export interface DiarizationSegment {
  speakerId: string;
  startTime: number;
  endTime: number;
}

export interface GenerationQueueItem {
  id: string;
  profileId: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultAudioBlob?: Blob;
  rating?: number;
  synthesisTimeMs?: number;
  createdAt: number;
}

const db = new Dexie('VoiceAppDB') as Dexie & {
  audioDrafts: EntityTable<AudioDraft, 'id'>;
  voiceProfiles: EntityTable<VoiceProfile, 'id'>;
  styleTemplates: EntityTable<VoiceStyleTemplate, 'id'>;
  diagnosisReports: EntityTable<SpeechDiagnosisReport, 'id'>;
  generationQueue: EntityTable<GenerationQueueItem, 'id'>;
};

db.version(1).stores({
  audioDrafts: 'id, createdAt',
  voiceProfiles: 'id, name, createdAt',
  styleTemplates: 'id, name',
  diagnosisReports: 'id, profileId, createdAt',
  generationQueue: 'id, profileId, status, createdAt'
});

export { db };
