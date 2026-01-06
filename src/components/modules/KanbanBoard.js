"use client";

const columns = ["Pending", "In Progress", "Completed", "Cancelled"];

export default function KanbanBoard({ tasks = [], onComplete }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <div key={column} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-600">{column}</h4>
            <span className="text-xs text-slate-400">
              {tasks.filter((task) => task.column === column).length}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {tasks
              .filter((task) => task.column === column)
              .map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">{task.title}</p>
                    {/* Status badge */}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${
                      task.status === "completed" ? "bg-green-100 text-green-700" :
                      task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      task.status === "cancelled" ? "bg-rose-100 text-rose-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {task.status === "completed" ? "Done" :
                       task.status === "in_progress" ? "Active" :
                       task.status === "cancelled" ? "Cancelled" :
                       "Pending"}
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.description}</p>
                  )}
                  {task.property && (
                    <p className="mt-2 text-xs text-slate-600 font-medium truncate">
                      📍 {task.property}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
                        {task.assignee?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs text-slate-600 truncate max-w-[100px]">{task.assignee}</span>
                    </div>
                    {column !== "Completed" && column !== "Cancelled" && task.status !== "completed" ? (
                      <button
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => onComplete?.(task.id)}
                      >
                        Mark Done
                      </button>
                    ) : task.status === "completed" || column === "Completed" ? (
                      <span className="text-xs text-emerald-600 font-medium">✓ Done</span>
                    ) : null}
                  </div>
                  {task.createdAt && (
                    <p className="mt-2 text-[10px] text-slate-400">
                      {new Date(task.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

