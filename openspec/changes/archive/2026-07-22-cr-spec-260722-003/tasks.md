## 1. Schema 與 Migration

- [x] 1.1 `prisma/schema/support-inquiry.prisma`：`SupportInquiry` 新增 `courseInviteId Int?` 與 `courseInvite CourseInvite? @relation(fields: [courseInviteId], references: [id], onDelete: SetNull)`。
- [x] 1.2 `prisma/schema/course-invite.prisma`：`CourseInvite` model 新增反向關聯 `inquiries SupportInquiry[]`（比照既有 `orders CourseOrder[]`／`messages CourseMessage[]` 風格）。
- [x] 1.3 `make schema-update name=add_support_inquiry_course_link` 產生並套用本地開發庫 migration。
- [x] 1.4 `make prisma-status` 確認 migration 狀態正常。

## 2. 提問表單元件拆分

- [x] 2.1 新增 `components/support-inquiry/support-inquiry-form.tsx`：從 `contact-admin-dialog.tsx` 抽出表單核心（分類 Select＋內容 Textarea＋送出按鈕＋驗證錯誤顯示），props：`fixedCategory?: 'account' | 'course' | 'material' | 'other'`（提供時隱藏分類 Select、改顯示固定分類文字）、`courseInviteId?: number`（隨表單一併送出）、`onSuccess?: () => void`（另新增 `onCancel?: () => void`，提供時顯示取消按鈕，供 Dialog 外殼使用）。
- [x] 2.2 `components/support-inquiry/contact-admin-dialog.tsx` 改為薄殼：Dialog 包住 `SupportInquiryForm`，新增 props `fixedCategory?`／`courseInviteId?` 並轉傳；保留現有 `open`/`onOpenChange` 介面（供課程頁使用）。

## 3. Data / Action 擴充

- [x] 3.1 `lib/schemas/support-inquiry.ts`：`createInquirySchema` 新增可選 `courseInviteId: z.number().int().optional()`。
- [x] 3.2 `app/actions/support-inquiry.ts::submitInquiry`：解析後的 `courseInviteId` 一併寫入 `prisma.supportInquiry.create` 的 `data`。
- [x] 3.3 `lib/data/support-inquiry.ts::getInquiryList`：`opts` 新增可選 `userId?: string` 過濾參數（`where` 依存在與否組合 `status`／`userId`）；供會員詳情頁「會員提問」分頁與現有後台列表共用同一函式。
- [x] 3.4 `lib/data/support-inquiry.ts`：`InquiryListItem` 型別新增 `submitterRealName`／`submitterGenderLabel`／`submitterChurchLabel`／`courseInviteId`／`courseTitle`；`MyInquiryItem` 一併新增 `courseInviteId`／`courseTitle`（供學員自己檢視提問時亦可看到相關課程）；對應 select 擴充 `realName`／`gender`／`churchType`／`church.name`／`churchOther`／`courseInvite.title`（性別為 `genderLabel()`、所屬單位為 `churchLabel()`，皆比照 `admin/members/[id]/page.tsx` 既有行內三元運算式邏輯於本檔案內組成純文字，不建立跨頁共用 util）。

## 4. Topbar 調整

- [x] 4.1 `components/layout/topbar.tsx`：圖示由 `IconHelpCircle` 改為 `IconMessageCircle`；移除 `ContactAdminDialog` 掛載與 `isContactAdminOpen` state。
- [x] 4.2 `components/layout/topbar.tsx`：按鈕移至「訊息通知」（`IconBell`）按鈕**左邊**（調整 JSX 順序）。
- [x] 4.3 `components/layout/topbar.tsx`：`onClick` 改為 `router.push(spiritId ? \`/user/${spiritId}/inquiries\` : '/login')`（比照既有「個人資料」按鈕 `router.push` 模式）。
- [x] 4.4 `messages/zh-TW.json` `nav.help` 值由「我需要幫助」改為「聯絡管理者」（順手同步 `messages/en.json` 為 "Contact Admin"）。

## 5. 個人專區調整

- [x] 5.1 `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx`：新增內嵌 `SupportInquiryForm`（一般模式，不帶 `fixedCategory`／`courseInviteId`），置於清單上方；`router.refresh()` 已內建於 `SupportInquiryForm` 本身（送出成功時自動呼叫），無需頁面另外處理；清單項目一併顯示 `courseTitle`（若有關聯課程）。
- [x] 5.2 `app/[locale]/(user)/user/[spiritId]/page.tsx`：移除先前新增的「我的提問」入口區塊（`IconMessageCircle` 連結卡片），移除對應未使用的 import。

## 6. 課程頁聯繫管理者入口

- [x] 6.1 `app/[locale]/(user)/course/[id]/page.tsx`：於 `isInstructor &&` 區塊內、`CopyInviteLinkButton` 右邊新增「聯繫管理者」按鈕，點擊開啟 `ContactAdminDialog`（`fixedCategory="course"`、`courseInviteId={courseSession.id}`）；新增獨立 client component `course-contact-admin-button.tsx`（比照 `copy-invite-link-button.tsx` 模式）。

## 7. 後台提問卡片元件重構

- [x] 7.1 新增 `components/admin/support-inquiry-card.tsx`：卡片式（`<div>`，非 `<tr>`）呈現，展開/收合狀態；顯示提問人「顯示名稱（真實姓名）· 性別 · 所屬單位」＋「查看會員」連結（`target="_blank"` 至 `/admin/members/{userId}`）；若 `courseInviteId` 有值，顯示「相關課程：{courseTitle}」連結（`target="_blank"` 至 `/course/{courseInviteId}`）；展開後沿用既有回覆表單／重新標記待處理邏輯（呼叫 `replyInquiry`／`reopenInquiry`，行為與原 `SupportInquiryRow` 一致）。
- [x] 7.2 `app/[locale]/(admin)/admin/support-inquiries/page.tsx`：table 容器改為 `<div className="space-y-3">` 卡片列表，改用 `SupportInquiryCard` 逐筆渲染並傳入新增欄位（`submitterRealName`／`submitterGenderLabel`／`submitterChurchLabel`／`courseInviteId`／`courseTitle`）。
- [x] 7.3 刪除 `components/admin/support-inquiry-actions.tsx`（`SupportInquiryRow` 功能已由 `SupportInquiryCard` 取代）；`grep` 確認無其他引用後才刪除。

## 8. 後台會員詳情頁新增分頁

- [x] 8.1 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：`TabsList` 新增第 5 個 `TabsTrigger value="inquiries"`（會員提問，透過局部引入 `getTranslations('supportInquiry')` 取得分類標籤與 tab 文案，與 `SupportInquiryCard` 內部翻譯資源一致；其餘既有 4 個分頁維持既有硬編碼繁體不變）；新增對應 `TabsContent`，呼叫 `getInquiryList({ userId: member.id, status: 'all' })` 並以 `SupportInquiryCard` 清單呈現；無資料時顯示空狀態。

## 9. i18n

- [x] 9.1 `messages/zh-TW.json` `supportInquiry` 命名空間：`dialogTitle` 統一調整用詞為「聯絡管理者」（與 Topbar 按鈕文案一致）；新增 `courseCategoryFixedNote`（分類已固定為課程問題之說明文字）、`viewMemberLink`（查看會員）、`relatedCoursePrefix`（相關課程：，兼作課程連結顯示文字，取代原規劃的獨立 `viewCourseLink`）、`memberInquiriesTab`（會員提問）、`memberInquiriesEmpty`（該會員尚無提問紀錄）。性別／所屬單位文字比照既有會員詳情頁風格，於 data layer 直接組成繁體純文字（不透過 i18n key，與該頁其餘既有欄位一致，非本次新增技術債）。
- [x] 9.2 `messages/en.json` 補譯 9.1 新增／調整的所有 key。
- [x] 9.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`。

## 10. 操作手冊與版本號

- [x] 10.1 `doc/學員手冊.md`：更新第十四章內容為新流程（Topbar 按鈕改名「聯絡管理者」、點擊直接進入「我的提問」頁面填寫與查看，不再是彈窗）；新增課程頁提問功能說明（供有授課的學員/講師參考）。
- [x] 10.2 `doc/老師手冊.md`：更新常見問題該則 Q&A，補充課程頁「聯繫管理者」按鈕（Share 按鈕右邊，自動歸類課程問題）之說明。
- [x] 10.3 `doc/管理者操作手冊.md`：更新第十九章「提問管理」，說明卡片式呈現、新增提問人真實姓名/性別/所屬單位、查看會員/查看課程連結；會員詳情頁新增「會員提問」分頁；附錄權限表不需變更（既有一列已涵蓋）。
- [x] 10.4 三份手冊檔首版本標註與日期同步更新（皆為 v0.1.152／2026-07-22，一併同步檔尾標註）。
- [x] 10.5 `config/version.json` patch 版本號 +1（0.1.151 → 0.1.152），`updatedAt` 更新為當日日期。

## 11. 驗證

- [x] 11.1 `npm run lint` 通過。
- [x] 11.2 `npm run build` 通過。
- [x] 11.3 手動測試：Topbar「聯絡管理者」按鈕位置（訊息通知左邊）、圖示、點擊導向 `/user/{spiritId}/inquiries`（不彈窗）。
- [x] 11.4 手動測試：個人專區「我的提問」頁面內送出提問（四選一分類皆測試）成功後清單即時顯示；個人專區首頁不再顯示「我的提問」入口。
- [x] 11.5 手動測試：課程頁（該課程講師視角）Share 按鈕右邊顯示「聯繫管理者」按鈕，點擊開啟 Dialog、分類固定顯示「課程問題」、送出成功後於後台/個人專區可見該筆提問已關聯正確課程。
- [x] 11.6 手動測試：後台「提問管理」頁面改為卡片呈現，卡片顯示提問人顯示名稱/真實姓名/性別/所屬單位；有課程關聯的卡片顯示課程連結，點擊另開視窗至該課程頁；「查看會員」連結另開視窗至該會員後台詳情頁。
- [x] 11.7 手動測試：後台會員詳情頁新增「會員提問」分頁，顯示該會員全部提問，回覆/重新標記待處理操作與「提問管理」頁面行為一致。
- [x] 11.8 手動測試：切換 zh-TW/en/zh-CN，確認新增/調整文案皆正確在地化，無裸 i18n key 顯示。
