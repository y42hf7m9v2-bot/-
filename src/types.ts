export type Gender = 'male' | 'female';

export interface PatientInfo {
  age: string;
  gender: Gender;
  height: string;
  weight: string;
}

export interface VitalSigns {
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  temperature: string;
}

export interface PQRSTAssessment {
  p: string; // Provocation/Palliation
  q: string; // Quality
  r: string; // Region/Radiation
  s: string; // Severity (0-10)
  t: string; // Time
}

export interface HealthHistory {
  pastMedicalHistory: string;
  familyHistory: string;
  lifestyle: string;
}

export interface AssessmentData {
  patient: PatientInfo;
  vitals: VitalSigns;
  history: HealthHistory;
  pqrst: PQRSTAssessment;
  followUpAnswers?: Record<string, string>;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
}

export interface DifferentialDiagnosis {
  name: string;
  description: string;
  probability: string; // e.g. "높음", "중간", "낮음"
}

export interface AnalysisResult {
  mainDiagnosis: string;
  differentials: DifferentialDiagnosis[];
  interventions: string[];
  precautions: string[];
  furtherAction: string;
}
