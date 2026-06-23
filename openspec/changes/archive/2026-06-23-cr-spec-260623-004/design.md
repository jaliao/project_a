## Context

`CourseSessionForm`（`components/course-session/course-session-form.tsx`）於 `useForm` 的 `defaultValues` 內，在 `isDev` 分支以 `new Date(Date.now() + …)` 計算 `expiredAt`／`courseDate`。React Compiler 的 `react-hooks/purity` 規則將 render 期間呼叫 `Date.now()` 視為不純，報 2 個 error 並跳過該元件的記憶化最佳化。

## Goals / Non-Goals

**Goals:**
- 消除 2 個 `react-hooks/purity` error，恢復 React Compiler 對該元件的最佳化。
- 保持 dev 預設值行為不變（`expiredAt` 早於 `courseDate`、僅 dev 帶入）。

**Non-Goals:**
- 不更動 production 行為、不調整表單欄位或驗證、不重構其他表單邏輯。

## Decisions

### 以 lazy `useState` 初始化器計算預設值，render 期間視為純值
在元件內以 `useState(() => ({ expiredAt: …, courseDate: … }))` 於首次 mount 計算一次日期，再把其值帶入 `defaultValues`。`useState` 初始化器只在 mount 執行、不在每次 render 重算，故 `Date.now()` 不再於 render 期間被呼叫，符合 purity 規則。

- **替代方案 A：`useMemo(() => …, [])`** — 可行，但 `useMemo` 語意上不保證只算一次（理論上可被丟棄重算），對「固定初值」用 `useState` 初始化器語意更精準。
- **替代方案 B：模組層級常數** — 否決，模組載入時計算會讓「現在＋N 天」在長生命週期下偏移，且仍屬全域副作用。

### 將 `handleSubmit` 延到提交時呼叫，避免 render 期間傳入讀 ref 的 handler
修正 purity error 後，React Compiler 進一步分析浮現 `react-hooks/refs`：`form.handleSubmit(onSubmit)` 於 render 期間執行，而 `onSubmit` 會讀取 `titleDirtyRef.current`，被判定為「render 期間可能讀取 ref」。改以 `onSubmit={(e) => form.handleSubmit(onSubmit)(e)}`，使 `handleSubmit` 僅在提交事件時呼叫，`onSubmit` 不再於 render 期間被傳入分析。行為等價（提交時機與結果不變）。

- **替代方案：`eslint-disable` 該行** — 否決，雖屬規則誤報，但延後呼叫是更乾淨且零副作用的等價寫法，不需抑制規則。

## Risks / Trade-offs

- **行為差異風險**：預設日期改為 mount 時計算（原為 render 時）→ 實務上 `useForm` 也只讀一次 `defaultValues`，差異無感。可由 spec 場景「跨 render 穩定」涵蓋驗證。
- **範圍極小**：僅單一元件、2 個值，低風險。
