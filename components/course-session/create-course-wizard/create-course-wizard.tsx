/*
 * ----------------------------------------------
 * CreateCourseWizard - 三步驟開課精靈主容器
 * 2026-03-30
 * components/course-session/create-course-wizard/create-course-wizard.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import type { CourseLevel } from '@/config/course-catalog'
import { Step1CourseCard } from './step-1-course-card'
import { Step2BasicInfo, type Step2FormValues } from './step-2-basic-info'
import { Step3Preview } from './step-3-preview'
import { InviteStep } from './invite-step'

type WizardStep = 1 | 2 | 3 | 'invite'

interface CreateCourseWizardProps {
  instructorName: string
  // 使用者已取得的講師等級數字陣列（e.g. [1, 2]），由 Server Component 傳入
  instructorLevels: number[]
  isAdmin: boolean
  onClose: () => void
}

// 步驟標題
const STEP_TITLES: Record<WizardStep, string> = {
  1: '選擇課程',
  2: '填寫資料',
  3: '預覽確認',
  invite: '邀請學員',
}

export function CreateCourseWizard({
  instructorName,
  instructorLevels,
  isAdmin,
  onClose,
}: CreateCourseWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | null>(null)
  const [formValues, setFormValues] = useState<Step2FormValues | null>(null)
  const [createdInviteId, setCreatedInviteId] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {/* 步驟指示器 */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {([1, 2, 3] as const).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span
              className={
                step === s || (step === 'invite' && s === 3)
                  ? 'font-semibold text-foreground'
                  : typeof step === 'number' && step > s
                  ? 'text-primary'
                  : ''
              }
            >
              {s}. {STEP_TITLES[s]}
            </span>
            {s < 3 && <span>›</span>}
          </span>
        ))}
        {step === 'invite' && (
          <span className="flex items-center gap-1">
            <span>›</span>
            <span className="font-semibold text-foreground">邀請學員</span>
          </span>
        )}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Step1CourseCard
          selected={selectedLevel}
          onSelect={setSelectedLevel}
          onNext={() => setStep(2)}
          instructorLevels={instructorLevels}
          isAdmin={isAdmin}
        />
      )}

      {/* Step 2 */}
      {step === 2 && selectedLevel && (
        <Step2BasicInfo
          courseLevel={selectedLevel}
          instructorName={instructorName}
          defaultValues={formValues ?? undefined}
          onNext={(values) => {
            setFormValues(values)
            setStep(3)
          }}
          onBack={() => setStep(1)}
        />
      )}

      {/* Step 3 */}
      {step === 3 && formValues && (
        <Step3Preview
          formValues={formValues}
          onSuccess={(inviteId) => {
            setCreatedInviteId(inviteId)
            setStep('invite')
          }}
          onBack={() => setStep(2)}
        />
      )}

      {/* 邀請階段 */}
      {step === 'invite' && createdInviteId && (
        <InviteStep courseInviteId={createdInviteId} onClose={onClose} />
      )}
    </div>
  )
}
