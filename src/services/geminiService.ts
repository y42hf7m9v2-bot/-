import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData, FollowUpQuestion, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateFollowUpQuestions(data: AssessmentData): Promise<FollowUpQuestion[]> {
  const prompt = `
    당신은 전문 간호사 및 임상 전문가입니다. 
    다음 환자의 기초 정보, 생체 징후(Vital Signs), 그리고 PQRST 통증 사정 결과를 바탕으로, 
    정확한 흉통 원인(예: 심근경색, 협심증, 위식도역류질환, 기흉, 근골격계 통증 등)을 감별하기 위해 
    환자에게 추가로 물어볼 질문 4개를 생성해주세요.
    
    환자 정보:
    - 나이: ${data.patient.age}, 성별: ${data.patient.gender === 'male' ? '남성' : '여성'}
    - 키: ${data.patient.height}cm, 몸무게: ${data.patient.weight}kg
    - 혈압: ${data.vitals.bloodPressure}, 맥박: ${data.vitals.pulse}, 호흡: ${data.vitals.respiratoryRate}, 체온: ${data.vitals.temperature}
    
    건강 관련 기력:
    - 과거력: ${data.history.pastMedicalHistory}
    - 가족력: ${data.history.familyHistory}
    - 생활습관: ${data.history.lifestyle}
    
    PQRST 사정:
    - P (악화/완화): ${data.pqrst.p}
    - Q (통증 양상): ${data.pqrst.q}
    - R (부위/방사): ${data.pqrst.r}
    - S (강도): ${data.pqrst.s}/10
    - T (시간/지속): ${data.pqrst.t}
    
    질문은 환자가 '예/아니오' 또는 짧게 답할 수 있는 구체적인 질문이어야 합니다.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING }
            },
            required: ["id", "question"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return [
      { id: "q1", question: "식사 후에 통증이 더 심해지나요?" },
      { id: "q2", question: "숨을 크게 들이마실 때 통증이 변하나요?" },
      { id: "q3", question: "식은땀이 나거나 메스꺼운 증상이 있나요?" },
      { id: "q4", question: "통증이 왼쪽 팔이나 턱으로 뻗치나요?" }
    ];
  }
}

export async function analyzeFinalAssessment(data: AssessmentData): Promise<AnalysisResult> {
  const followUpText = data.followUpAnswers 
    ? Object.entries(data.followUpAnswers).map(([q, a]) => `질문: ${q}, 답변: ${a}`).join("\n")
    : "없음";

  const prompt = `
    당신은 숙련된 상급 선별진료(Triage) 간호사이자 임상 전문가입니다. 
    아래 환자 데이터를 바탕으로 현재 가장 의심되는 주진단과 감별이 필요한 부진단 목록을 제시해주세요.
    
    환자 정보:
    - 나이: ${data.patient.age}, 성별: ${data.patient.gender === 'male' ? '남성' : '여성'}
    - 신체계측: ${data.patient.height}cm, ${data.patient.weight}kg
    - 생체 징후: BP ${data.vitals.bloodPressure}, Pulse ${data.vitals.pulse}, RR ${data.vitals.respiratoryRate}, Temp ${data.vitals.temperature}
    
    건강 정보:
    - 과거력: ${data.history.pastMedicalHistory}
    - 가족력: ${data.history.familyHistory}
    - 생활습관: ${data.history.lifestyle}
    
    PQRST 통증 사정:
    - P (Provocation/Palliation): ${data.pqrst.p}
    - Q (Quality): ${data.pqrst.q}
    - R (Region/Radiation): ${data.pqrst.r}
    - S (Severity): ${data.pqrst.s}/10
    - T (Time): ${data.pqrst.t}
    
    추가 문진 답변:
    ${followUpText}
    
    결과는 반드시 다음 구조의 JSON이어야 합니다:
    1. mainDiagnosis: 가장 의심되는 주된 증상/병명 (한글)
    2. differentials: 감별이 필요한 질병 목록. 각 항목은 { name: "병명", description: "간략한 설명", probability: "높음/중간/낮음" } 형태여야 함.
    3. interventions: 구체적인 간호 중재 (예: 산소 공급, 심전도 모니터링 등) (문자열 배열)
    4. precautions: 절대 주의사항 및 응급 징후 (문자열 배열)
    5. furtherAction: 의료진 협진 또는 추가 필요한 정밀 검사 권고
    
    답변은 간호학과 학생이 임상 추론력을 기를 수 있도록 전문적인 한국어로 작성해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainDiagnosis: { type: Type.STRING },
            differentials: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  probability: { type: Type.STRING }
                },
                required: ["name", "description", "probability"]
              } 
            },
            interventions: { type: Type.ARRAY, items: { type: Type.STRING } },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            furtherAction: { type: Type.STRING }
          },
          required: ["mainDiagnosis", "differentials", "interventions", "precautions", "furtherAction"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing final assessment:", error);
    throw error;
  }
}
