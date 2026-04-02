/*
 * ----------------------------------------------
 * 教會清單管理元件（Client Component）
 * 2026-04-02
 * components/admin/church-list.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  createChurchAction,
  updateChurchAction,
  toggleChurchActiveAction,
  deleteChurchAction,
} from '@/app/actions/church'

type Church = {
  id: number
  name: string
  isActive: boolean
  sortOrder: number
  memberCount: number
}

export function ChurchList({ churches }: { churches: Church[] }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSortOrder, setEditSortOrder] = useState(0)
  const [newName, setNewName] = useState('')
  const [newSortOrder, setNewSortOrder] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startEdit(church: Church) {
    setEditingId(church.id)
    setEditName(church.name)
    setEditSortOrder(church.sortOrder)
    setError(null)
  }

  function handleUpdate(id: number) {
    setError(null)
    startTransition(async () => {
      const res = await updateChurchAction(id, editName, editSortOrder)
      if (res.success) {
        setEditingId(null)
      } else {
        setError(res.errors?.name?.[0] ?? res.message ?? '更新失敗')
      }
    })
  }

  function handleToggle(id: number) {
    startTransition(async () => {
      await toggleChurchActiveAction(id)
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deleteChurchAction(id)
      if (!res.success) setError(res.message ?? '刪除失敗')
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await createChurchAction(
        newName,
        newSortOrder ? parseInt(newSortOrder, 10) : undefined
      )
      if (res.success) {
        setNewName('')
        setNewSortOrder('')
      } else {
        setError(res.errors?.name?.[0] ?? res.message ?? '新增失敗')
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      {/* 教會清單 */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">名稱</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">排序</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">狀態</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">會員數</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {churches.map((church, i) => (
              <tr key={church.id} className={i < churches.length - 1 ? 'border-b' : ''}>
                {editingId === church.id ? (
                  <>
                    <td className="px-4 py-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(parseInt(e.target.value, 10))}
                        className="h-7 w-20 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => handleUpdate(church.id)}
                        >
                          儲存
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{church.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{church.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Badge variant={church.isActive ? 'default' : 'secondary'}>
                        {church.isActive ? '啟用' : '停用'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{church.memberCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => startEdit(church)}
                        >
                          編輯
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => handleToggle(church.id)}
                        >
                          {church.isActive ? '停用' : '啟用'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={isPending}
                            >
                              刪除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確定刪除「{church.name}」？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作無法復原。若有會員關聯此教會，將無法刪除。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(church.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {churches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  尚無教會資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新增教會 */}
      <form onSubmit={handleCreate} className="flex items-end gap-3 rounded-lg border p-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground font-medium">名稱</label>
          <Input
            placeholder="教會/單位名稱"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="w-24 space-y-1">
          <label className="text-xs text-muted-foreground font-medium">排序（選填）</label>
          <Input
            type="number"
            placeholder="自動"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending || !newName.trim()}>
          新增
        </Button>
      </form>
    </div>
  )
}
