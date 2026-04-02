/*
 * ----------------------------------------------
 * 會員學習階層樹狀元件（Server Component）
 * 2026-04-02
 * components/admin/member-hierarchy-tree.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { getMemberHierarchy, type HierarchyNode } from '@/lib/data/hierarchy'

type Props = {
  userId: string
  depth: number
}

function displayName(node: { realName: string | null; name: string | null }): string {
  return node.realName || node.name || '（未填）'
}

function NodeLink({
  node,
  isRoot = false,
}: {
  node: { id: string; realName: string | null; name: string | null; spiritId: string | null }
  isRoot?: boolean
}) {
  return (
    <Link
      href={`/admin/members/${node.id}`}
      className={
        isRoot
          ? 'inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary/20'
          : 'inline-flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted'
      }
    >
      <span>{displayName(node)}</span>
      {node.spiritId && (
        <span className="font-mono text-xs text-muted-foreground">{node.spiritId}</span>
      )}
    </Link>
  )
}

function StudentTree({ node, indent = 0 }: { node: HierarchyNode; indent?: number }) {
  return (
    <li>
      <div style={{ paddingLeft: `${indent * 1.5}rem` }} className="py-0.5">
        <NodeLink node={node} />
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <StudentTree key={child.id} node={child} indent={indent + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export async function MemberHierarchyTree({ userId, depth }: Props) {
  const { teacher, root } = await getMemberHierarchy(userId, depth)

  return (
    <div className="space-y-6">
      {/* 老師 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">老師</h3>
        {teacher ? (
          <NodeLink node={teacher} />
        ) : (
          <p className="text-sm text-muted-foreground">無老師紀錄</p>
        )}
      </div>

      {/* 中心節點 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">本人</h3>
        <NodeLink node={root} isRoot />
      </div>

      {/* 學生樹 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          學生（向下 {depth} 層）
        </h3>
        {root.children.length > 0 ? (
          <ul className="space-y-0.5">
            {root.children.map((child) => (
              <StudentTree key={child.id} node={child} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">此會員尚未帶領學員</p>
        )}
      </div>
    </div>
  )
}
