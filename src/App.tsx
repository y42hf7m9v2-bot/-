/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  User, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ClipboardCheck,
  Zap,
  Info
} from 'lucide-react';
import { PatientInfo, VitalSigns, PQRSTAssessment, HealthHistory, AssessmentData, FollowUpQuestion, AnalysisResult } from './types';
import { generateFollowUpQuestions, analyzeFinalAssessment } from './services/geminiService';

type Step = 'intro' | 'basicInfo' | 'history' | 'pqrst' | 'followup' | 'result';

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [patient, setPatient] = useState<PatientInfo>({ age: '', gender: 'male', height: '', weight: '' });
  const [vitals, setVitals] = useState<VitalSigns>({ bloodPressure: '', pulse: '', respiratoryRate: '', temperature: '' });
  const [history, setHistory] = useState<HealthHistory>({ pastMedicalHistory: '', familyHistory: '', lifestyle: '' });
  const [pqrst, setPqrst] = useState<PQRSTAssessment>({ p: '', q: '', r: '', s: '5', t: '' });
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const goToNextStep = async () => {
    if (currentStep === 'intro') setCurrentStep('basicInfo');
    else if (currentStep === 'basicInfo') setCurrentStep('history');
    else if (currentStep === 'history') setCurrentStep('pqrst');
    else if (currentStep === 'pqrst') {
      setIsLoading(true);
      const data: AssessmentData = { patient, vitals, history, pqrst };
      const questions = await generateFollowUpQuestions(data);
      setFollowUpQuestions(questions);
      setIsLoading(false);
      setCurrentStep('followup');
    } else if (currentStep === 'followup') {
      setIsLoading(true);
      const data: AssessmentData = { patient, vitals, history, pqrst, followUpAnswers };
      const analysis = await analyzeFinalAssessment(data);
      setResult(analysis);
      setIsLoading(false);
      setCurrentStep('result');
    }
  };

  const goToPrevStep = () => {
    if (currentStep === 'basicInfo') setCurrentStep('intro');
    else if (currentStep === 'history') setCurrentStep('basicInfo');
    else if (currentStep === 'pqrst') setCurrentStep('history');
    else if (currentStep === 'followup') setCurrentStep('pqrst');
    else if (currentStep === 'result') setCurrentStep('followup');
  };

  const reset = () => {
    setCurrentStep('intro');
    setPatient({ age: '', gender: 'male', height: '', weight: '' });
    setVitals({ bloodPressure: '', pulse: '', respiratoryRate: '', temperature: '' });
    setHistory({ pastMedicalHistory: '', familyHistory: '', lifestyle: '' });
    setPqrst({ p: '', q: '', r: '', s: '5', t: '' });
    setFollowUpAnswers({});
    setResult(null);
  };

  const isStepValid = () => {
    if (currentStep === 'basicInfo') {
      return patient.age && patient.height && patient.weight && 
             vitals.bloodPressure && vitals.pulse && vitals.respiratoryRate && vitals.temperature;
    }
    if (currentStep === 'history') {
      return history.pastMedicalHistory && history.familyHistory && history.lifestyle;
    }
    if (currentStep === 'pqrst') {
      return pqrst.p && pqrst.q && pqrst.r && pqrst.t;
    }
    if (currentStep === 'followup') {
      return Object.keys(followUpAnswers).length === followUpQuestions.length;
    }
    return true;
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'basicInfo': return 1;
      case 'history': return 2;
      case 'pqrst': return 3;
      case 'followup': return 4;
      case 'result': return 5;
      default: return 0;
    }
  };

  const stepNumber = getStepNumber();

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="text-white w-5 h-5" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">흉통 사정 도우미</h1>
          </div>
          {stepNumber > 0 && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {stepNumber}/5 단계
            </span>
          )}
        </div>
        {/* Progress Bar */}
        {stepNumber > 0 && (
          <div className="w-full h-1 bg-gray-100">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${(stepNumber / 5) * 100}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center py-10"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Activity className="text-blue-600 w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">간호 학생을 위한<br />흉통 사정 지원 도구</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                환자의 활력 징후와 PQRST 통증 사정을 입력하면,<br />
                AI가 임상 데이터를 분석하여 예상 주진단과<br />
                감별 진단 목록, 간호 중재를 안내합니다.
              </p>
              <button
                id="start-button"
                onClick={goToNextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                사정 시작하기
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100">
                <Info className="w-3 h-3" />
                본 앱은 교육 및 학습 보조용이며 전문적 진단을 대신하지 않습니다.
              </div>
            </motion.div>
          )}

          {currentStep === 'basicInfo' && (
            <motion.div
              key="basicInfo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-10"
            >
              <div className="mb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <User className="text-blue-500" /> 환자 기본 정보 및 활력 징후
                </h2>
                <p className="text-gray-500 text-sm">환자의 기초 인적 정보와 생체 정보를 입력해주세요.</p>
              </div>

              {/* Patient Profile Section */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-2 px-1 uppercase tracking-wider">인적 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">나이</label>
                    <input
                      type="number"
                      placeholder="세"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={patient.age}
                      onChange={e => setPatient({ ...patient, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">성별</label>
                    <div className="flex bg-gray-50 rounded-2xl p-1">
                      <button
                        onClick={() => setPatient({ ...patient, gender: 'male' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${patient.gender === 'male' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                      >남성</button>
                      <button
                        onClick={() => setPatient({ ...patient, gender: 'female' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${patient.gender === 'female' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400'}`}
                      >여성</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">신장 (cm)</label>
                    <input
                      type="number"
                      placeholder="cm"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={patient.height}
                      onChange={e => setPatient({ ...patient, height: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">체중 (kg)</label>
                    <input
                      type="number"
                      placeholder="kg"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={patient.weight}
                      onChange={e => setPatient({ ...patient, weight: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Vitals Section */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-2 px-1 uppercase tracking-wider">활력 징후 (Vital Signs)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">혈압 (BP)</label>
                    <input
                      type="text"
                      placeholder="예: 120/80"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-red-400 transition-all font-medium"
                      value={vitals.bloodPressure}
                      onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">맥박 (HR)</label>
                    <input
                      type="number"
                      placeholder="회/분"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-red-400 transition-all font-medium"
                      value={vitals.pulse}
                      onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">호흡 (RR)</label>
                    <input
                      type="number"
                      placeholder="회/분"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-red-400 transition-all font-medium"
                      value={vitals.respiratoryRate}
                      onChange={e => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 px-1">체온 (BT)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="°C"
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-red-400 transition-all font-medium"
                      value={vitals.temperature}
                      onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goToPrevStep}
                  className="w-16 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={goToNextStep}
                  disabled={!isStepValid()}
                  className="flex-1 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  다음 단계 (PQRST)
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <ClipboardCheck className="text-purple-500" /> 병력 및 생활습관
                </h2>
                <p className="text-gray-500 text-sm">과거 질환, 가족력, 위험 요인을 상세히 기록하세요.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-purple-600 uppercase tracking-wider px-1">과거력 (Past Medical History)</label>
                  <textarea
                    placeholder="예: 고혈압, 당뇨, 고지혈증 유무 및 수술 이력"
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition-all font-medium min-h-[100px] resize-none"
                    value={history.pastMedicalHistory}
                    onChange={e => setHistory({ ...history, pastMedicalHistory: e.target.value })}
                  />
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-purple-600 uppercase tracking-wider px-1">가족력 (Family History)</label>
                  <textarea
                    placeholder="예: 직계 가족 중 심장질환, 뇌졸중 유무"
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition-all font-medium min-h-[100px] resize-none"
                    value={history.familyHistory}
                    onChange={e => setHistory({ ...history, familyHistory: e.target.value })}
                  />
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-purple-600 uppercase tracking-wider px-1">생활습관 및 위험행동 (Lifestyle)</label>
                  <textarea
                    placeholder="예: 흡연 여부(갑/일), 음주 빈도, 운동 습관, 스트레스 정도"
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition-all font-medium min-h-[100px] resize-none"
                    value={history.lifestyle}
                    onChange={e => setHistory({ ...history, lifestyle: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goToPrevStep}
                  className="w-16 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={goToNextStep}
                  disabled={!isStepValid()}
                  className="flex-1 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  다음 단계 (PQRST)
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'pqrst' && (
            <motion.div
              key="pqrst"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <ClipboardCheck className="text-orange-500" /> PQRST 통증 사정
                </h2>
                <p className="text-gray-500 text-sm">환자가 호소하는 통증의 구체적인 양상을 기록하세요.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">P: Provocation / Palliation</label>
                  <p className="text-[10px] text-gray-400 font-medium -mt-1 uppercase">무엇을 할 때 아픈지, 무엇을 하면 나아지는지</p>
                  <input
                    type="text"
                    placeholder="예: 운동 시 악화, 휴식 시 완화"
                    className="w-full bg-gray-50 border-0 rounded-xl p-3 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    value={pqrst.p}
                    onChange={e => setPqrst({ ...pqrst, p: e.target.value })}
                  />
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Q: Quality</label>
                  <p className="text-[10px] text-gray-400 font-medium -mt-1 uppercase">어떻게 아픈지 (양상)</p>
                  <input
                    type="text"
                    placeholder="예: 짓누르는 듯함, 쥐어짜는 듯함"
                    className="w-full bg-gray-50 border-0 rounded-xl p-3 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    value={pqrst.q}
                    onChange={e => setPqrst({ ...pqrst, q: e.target.value })}
                  />
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">R: Region / Radiation</label>
                  <p className="text-[10px] text-gray-400 font-medium -mt-1 uppercase">통증 부위 및 다른 곳으로 뻗치는지(방사통)</p>
                  <input
                    type="text"
                    placeholder="예: 흉골 아래, 왼쪽 어깨로 방사"
                    className="w-full bg-gray-50 border-0 rounded-xl p-3 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    value={pqrst.r}
                    onChange={e => setPqrst({ ...pqrst, r: e.target.value })}
                  />
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                   <div className="flex justify-between items-center text-xs font-bold">
                     <label className="text-blue-600 uppercase tracking-wider">S: Severity</label>
                     <span className="text-orange-500">강도: {pqrst.s} / 10</span>
                   </div>
                  <p className="text-[10px] text-gray-400 font-medium -mt-1 uppercase">환자가 느끼는 통증의 정도</p>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={pqrst.s}
                    onChange={e => setPqrst({ ...pqrst, s: e.target.value })}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                    <span>안 아픔 (0)</span>
                    <span>중간 (5)</span>
                    <span>매우 아픔 (10)</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">T: Time</label>
                  <p className="text-[10px] text-gray-400 font-medium -mt-1 uppercase">통증이 언제 시작되었고 얼마나 지속되는지</p>
                  <input
                    type="text"
                    placeholder="예: 10분 전 시작, 약 5분간 지속"
                    className="w-full bg-gray-50 border-0 rounded-xl p-3 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    value={pqrst.t}
                    onChange={e => setPqrst({ ...pqrst, t: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={goToPrevStep}
                  className="w-16 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={goToNextStep}
                  disabled={!isStepValid() || isLoading}
                  className="flex-1 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  {isLoading ? '분석 중...' : '다음 분석 단계'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'followup' && (
            <motion.div
              key="followup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <Zap className="text-yellow-500" /> 감별 진단을 위한 추가 질문
                </h2>
                <p className="text-gray-500 text-sm">보다 정확한 판단을 위해 AI가 생성한 질문에 답해주세요.</p>
              </div>

              <div className="space-y-4">
                {followUpQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-50 text-blue-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <p className="font-semibold text-gray-800">{q.question}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFollowUpAnswers({ ...followUpAnswers, [q.question]: '예' })}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border ${followUpAnswers[q.question] === '예' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                      >예</button>
                      <button
                        onClick={() => setFollowUpAnswers({ ...followUpAnswers, [q.question]: '아니오' })}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border ${followUpAnswers[q.question] === '아니오' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                      >아니오</button>
                      <button
                        onClick={() => setFollowUpAnswers({ ...followUpAnswers, [q.question]: '모름' })}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border ${followUpAnswers[q.question] === '모름' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                      >모름</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goToPrevStep}
                  className="w-16 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={goToNextStep}
                  disabled={!isStepValid() || isLoading}
                  className="flex-1 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  {isLoading ? '최종 분석 중...' : '최종 결과 확인'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 pb-20"
            >
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-gray-100">
                <div className="bg-blue-600 px-8 py-10 text-white text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">분석 및 간호 제언</h2>
                  <p className="text-blue-100 text-sm">종합 사정 결과를 바탕으로 도출된 최종 분석입니다.</p>
                </div>
                
                <div className="p-8 space-y-10">
                  {/* Main Diagnosis */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-1 h-1 bg-blue-600 rounded-full" /> 의심되는 주진단 (Primary)
                    </h3>
                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                      <p className="text-blue-900 text-xl font-bold leading-relaxed mb-1">
                        {result.mainDiagnosis}
                      </p>
                    </div>
                  </div>

                  {/* Differential Diagnosis List */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-1 h-1 bg-purple-500 rounded-full" /> 감별 진단 및 설명 (Differential)
                    </h3>
                    <div className="space-y-3">
                      {result.differentials.map((diff, idx) => (
                        <div key={idx} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{diff.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              diff.probability === '높음' ? 'bg-red-100 text-red-600' : 
                              diff.probability === '중간' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'
                            }`}>가능성: {diff.probability}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{diff.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interventions */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-1 h-1 bg-green-500 rounded-full" /> 제안되는 간호 중재
                    </h3>
                    <ul className="space-y-3">
                      {result.interventions.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          <span className="text-green-500 font-bold shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Precautions */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-1 h-1 bg-red-500 rounded-full" /> 중요 주의사항 (핵심 징후)
                    </h3>
                    <ul className="space-y-3">
                      {result.precautions.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700 bg-red-50/20 p-3 rounded-xl border border-red-50">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Further Action */}
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">후속 조치 및 추가 검사 권고</h3>
                    <p className="text-sm font-medium text-blue-800 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      {result.furtherAction}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                새로운 사정 시작하기
              </button>

              <div className="text-center">
                <p className="text-[10px] text-gray-400 leading-normal">
                  주의: 본 도구는 교육용 AI 분석 결과이며 의학적 진단을 대신할 수 없습니다.<br />
                  환자의 상태가 악화되는 경우 즉시 상급 의료진 또는 응급의료체계에 보고하십시오.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/70 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold mb-2">AI가 환자 데이터를 사정 중입니다</h3>
            <p className="text-gray-500 text-sm">임상 데이터베이스와 실시간 매칭하여 감별 진단을 수행하고 있습니다.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
