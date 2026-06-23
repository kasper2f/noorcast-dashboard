# بيانات تجريبية لـ Noorcast Dashboard

## 1. إنشاء مستخدمين في Authentication

في [Firebase Console → Authentication](https://console.firebase.google.com/project/noorcast-53ecf/authentication/users):

| البريد | كلمة المرور | القسم |
|--------|-------------|-------|
| finance@noorcast.com | Test1234! | المالية |
| ops@noorcast.com | Test1234! | التشغيل |
| hr@noorcast.com | Test1234! | HR |

## 2. إضافة الموظفين في Firestore

Collection: `employees` — Document ID = **UID** من Authentication

```
finance@noorcast.com:
  email: "finance@noorcast.com"
  fullName: "سارة العتيبي"
  department: "finance"
  role: "employee"

ops@noorcast.com:
  email: "ops@noorcast.com"
  fullName: "محمد الشمري"
  department: "operations"
  role: "employee"

hr@noorcast.com:
  email: "hr@noorcast.com"
  fullName: "نورة القحطاني"
  department: "hr"
  role: "manager"
```

## 3. إضافة بيانات تجريبية

راجع `sample-data.json` لأمثلة على مستندات `finance`، `operations`، و `hr`.

**ملاحظة:** حقول `date` و `dueDate` و `startDate` من نوع **timestamp** في Firestore.

## 4. تفعيل Gemini (Firebase AI Logic)

1. [Firebase Console → AI Logic](https://console.firebase.google.com/project/noorcast-53ecf/ailogic)
2. فعّل **Gemini API**
3. تأكد من تفعيل **Firebase AI Logic** للمشروع

## 5. نشر قواعد الأمان

```powershell
npx firebase-tools deploy --only firestore:rules --project noorcast-53ecf
```
