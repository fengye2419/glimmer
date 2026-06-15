import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export function apiErrorMessage(err: unknown, fallback = '请求失败，请稍后重试') {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error || err.message || fallback
  }
  return fallback
}

export interface Student {
  id: string
  name: string
  grade: number
  created_at: string
}

export interface DashboardStats {
  total_attempts: number
  correct_count: number
  accuracy: number
  has_diagnosed: boolean
  avg_mastery: number
}

export interface Skill {
  id: string
  name: string
  grade: number
  description: string
  prerequisites: string[]
}

export interface MasteryItem {
  skill_id: string
  skill_name: string
  p_known: number
}

export interface WeakSkill {
  skill_id: string
  skill_name: string
  p_known: number
}

export interface RootCause {
  skill_id: string
  skill_name: string
  p_known: number
  chain: string[]
}

export interface DueReview {
  skill_id: string
  skill_name: string
  stage: number
}

export interface TrendPoint {
  date: string
  avg_mastery: number
}

export interface Dashboard {
  student: Student
  stats: DashboardStats
  mastery_map: MasteryItem[]
  weak_skills: WeakSkill[]
  due_reviews: DueReview[]
  trend: TrendPoint[]
  ollama_healthy: boolean
}

export interface QuestionBrief {
  id: string
  stem: string
  difficulty: number
}

export interface PracticeNext extends QuestionBrief {
  reason: string
  target_skill_id?: string
  target_skill_name?: string
}

export interface SubmitResult {
  correct: boolean
  feedback: string
  updated_skills: MasteryItem[]
  root_causes?: RootCause[]
}

export interface TutorSession {
  id: string
  student_id: string
  question_id: string
  question_stem?: string
  state: string
  messages: { role: string; content: string }[]
}

export const listStudents = () => api.get<{ students: Student[] }>('/students')
export const createStudent = (name: string, grade: number) =>
  api.post<Student>('/students', { name, grade })
export const getStudent = (id: string) => api.get<Student>(`/students/${id}`)
export const getDashboard = (id: string) => api.get<Dashboard>(`/students/${id}/dashboard`)
export const getQuestion = (id: string) => api.get<QuestionBrief>(`/questions/${id}`)
export const getSkillsGraph = () => api.get<{ skills: Skill[] }>('/skills/graph')
export const startDiagnose = (id: string) =>
  api.post<{ questions: QuestionBrief[] }>(`/students/${id}/diagnose/start`)
export const submitDiagnose = (id: string, data: { question_id: string; answer: string; duration_ms: number }) =>
  api.post<SubmitResult>(`/students/${id}/diagnose/submit`, data)
export const getPracticeNext = (id: string) =>
  api.get<PracticeNext>(`/students/${id}/practice/next`)
export const submitPractice = (id: string, data: { question_id: string; answer: string; duration_ms: number }) =>
  api.post<SubmitResult>(`/students/${id}/practice/submit`, data)
export const createTutorSession = (id: string, questionId: string) =>
  api.post<TutorSession>(`/students/${id}/tutor/sessions`, { question_id: questionId })
export const getHealth = () => api.get<{ ollama_healthy: boolean }>('/health')

export function tutorChatStream(
  studentId: string,
  sessionId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (msg: string) => void,
) {
  fetch(`/api/students/${studentId}/tutor/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
    .then(async (res) => {
      if (!res.ok) {
        onError?.(`讲题服务异常 (${res.status})`)
        onDone()
        return
      }
      const reader = res.body?.getReader()
      if (!reader) {
        onError?.('无法读取响应流')
        onDone()
        return
      }
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onDone()
              return
            }
            try {
              onChunk(JSON.parse(data))
            } catch {
              onChunk(data)
            }
          }
        }
      }
      onDone()
    })
    .catch(() => {
      onError?.('网络连接失败，请检查后端服务')
      onDone()
    })
}

export const STUDENT_KEY = 'glimmer_student_id'
export const STUDENT_NAME_KEY = 'glimmer_student_name'

export function rememberStudent(id: string, name: string) {
  localStorage.setItem(STUDENT_KEY, id)
  localStorage.setItem(STUDENT_NAME_KEY, name)
}

export function forgetStudent() {
  localStorage.removeItem(STUDENT_KEY)
  localStorage.removeItem(STUDENT_NAME_KEY)
}
