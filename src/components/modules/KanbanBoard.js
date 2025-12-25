"use client";

const columns = ["To Do", "In Progress", "Review", "Done"];

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
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">{task.id}</span>
                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                      {task.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">Due {task.due}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{task.assignee}</span>
                    {column !== "Done" ? (
                      <button
                        className="text-emerald-600"
                        onClick={() => onComplete?.(task.id)}
                      >
                        Mark done
                      </button>
                    ) : (
                      <span className="text-emerald-600">✓ Complete</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

