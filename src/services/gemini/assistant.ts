import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '@/firebase/config';
import type { Employee } from '@/types/employee';

const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });

function buildSystemPrompt(employee: Employee): string {
  return `أنت مساعد ذكي لنظام "نوركاست" لإدارة المؤسسة.
تتحدث بالعربية فقط. أجب باختصار ووضوح.
معلومات الموظف الحالي:
- الاسم: ${employee.fullName}
- البريد: ${employee.email}
- القسم: ${employee.department}
- الدور: ${employee.role}
لا تكشف بيانات موظفين آخرين. ساعد الموظف في مهام قسمه فقط.`;
}

export async function askGemini(
  question: string,
  employee: Employee,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: buildSystemPrompt(employee) }] },
      { role: 'model', parts: [{ text: 'فهمت. سأساعدك بالعربية ضمن صلاحياتك.' }] },
      ...history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    ],
  });

  const result = await chat.sendMessage(question);
  return result.response.text();
}
