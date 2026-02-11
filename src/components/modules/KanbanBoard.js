"use client";

import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";

const columns = ["Dirty", "In Progress", "Clean", "Completed"];

// Map column names to status values
const columnToStatus = {
  Dirty: "dirty",
  "In Progress": "in_progress",
  Clean: "clean",
  Completed: "completed",
};

// Column header styles (accent per column)
const columnStyles = {
  Dirty: "bg-rose-50 border-rose-200/80 text-rose-800",
  "In Progress": "bg-blue-50 border-blue-200/80 text-blue-800",
  Clean: "bg-emerald-50 border-emerald-200/80 text-emerald-800",
  Completed: "bg-slate-50 border-slate-200/80 text-slate-700",
};

const cardAccentByColumn = {
  Dirty: "border-l-4 border-l-rose-400",
  "In Progress": "border-l-4 border-l-blue-500",
  Clean: "border-l-4 border-l-emerald-500",
  Completed: "border-l-4 border-l-slate-400",
};

function SortableTask({
  task,
  column,
  onEdit,
  onDelete,
  isProcessing,
  openDropdownId,
  setOpenDropdownId,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isProcessing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isProcessing ? 0.7 : 1,
  };

  const isDropdownOpen = openDropdownId === task.id;
  const cardAccent = cardAccentByColumn[column] || cardAccentByColumn["Dirty"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen, setOpenDropdownId]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all relative ${cardAccent} ${
        isProcessing
          ? "border-blue-300 bg-blue-50/60 cursor-wait ring-1 ring-blue-200"
          : ""
      }`}
    >
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10 pointer-events-none">
          <div className="flex items-center gap-2 text-blue-600">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-xs font-medium">Updating...</span>
          </div>
        </div>
      )}

      {/* Drag handle area */}
      <div
        {...(isProcessing ? {} : attributes)}
        {...(isProcessing ? {} : listeners)}
        className="cursor-grab active:cursor-grabbing touch-manipulation"
        style={{ touchAction: "manipulation" }}
      >
        <div className="flex items-start justify-between gap-2 pr-7">
          <p className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1 leading-snug">
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
        {task.property && (
          <p className="mt-2 text-xs text-slate-600 font-medium truncate flex items-center gap-1">
            <span className="text-slate-400">📍</span> {task.property}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-bold text-white shadow-sm">
              {task.assignee?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {task.assignee}
              </p>
              {task.createdAt && (
                <p className="text-[10px] text-slate-500">
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {task.payment && task.payment.amount !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 rounded-md px-1.5 py-0.5">
                <span className="font-semibold">${task.payment.amount || 0}</span>
                <span
                  className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                    (task.payment.status || "unpaid") === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {(task.payment.status || "unpaid") === "paid" ? "Paid" : "Unpaid"}
                </span>
              </div>
            )}

            <div
              className="dropdown-container z-20"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                data-dropdown-trigger
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpenDropdownId(isDropdownOpen ? null : task.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 bottom-8 z-30 w-40 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  {onEdit && (
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                        setOpenDropdownId(null);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                        setOpenDropdownId(null);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({
  column,
  tasks,
  onComplete,
  onEdit,
  onDelete,
  processingTasks = [],
  openDropdownId,
  setOpenDropdownId,
}) {
  const taskIds = tasks.map((task) => task.id);
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  });

  const accent = columnStyles[column] || columnStyles["Dirty"];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 min-h-[320px] flex flex-col transition-all duration-200 ${
        isOver
          ? "border-slate-400 bg-slate-50/80 shadow-md scale-[1.02]"
          : `border-slate-200/90 bg-white shadow-sm hover:shadow-md`
      }`}
    >
      <div
        className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 shrink-0 ${accent}`}
      >
        <h4 className="text-sm font-bold tracking-tight">{column}</h4>
        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/80 px-2 text-xs font-semibold text-slate-600 shadow-sm">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              column={column}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              isProcessing={processingTasks.includes(task.id)}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({
  tasks = [],
  onComplete,
  onStatusChange,
  onEdit,
  onDelete,
  processingTasks = [],
}) {
  const [activeId, setActiveId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    // Check if the drag was initiated from within a dropdown container
    const target = event.activatorEvent?.target;
    if (
      target &&
      (target.closest(".dropdown-container") ||
        target.closest("button[data-dropdown-trigger]"))
    ) {
      // Prevent drag if clicking on dropdown
      return;
    }
    setActiveId(event.active.id);
    // Close any open dropdowns when starting to drag
    setOpenDropdownId(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task being dragged
    const draggedTask = tasks.find((task) => task.id === activeId);
    if (!draggedTask) return;

    // Normalize current status so In Progress tasks always compare as "in_progress"
    const normalizeStatus = (status) => {
      if (status == null || status === "") return "dirty";
      const s = String(status).toLowerCase().trim().replace(/\s+/g, "_");
      if (s === "in-progress" || s === "in_progress") return "in_progress";
      if (s === "complete") return "completed";
      if (s === "canceled" || s === "cancelled") return "cancelled";
      return s;
    };

    const currentStatus = normalizeStatus(draggedTask.status);

    // Normalize column name so "In progress" (any casing) matches "In Progress"
    const toColumnKey = (col) => {
      if (!col || typeof col !== "string") return null;
      const c = col.trim();
      if (c.toLowerCase() === "in progress") return "In Progress";
      return columns.find((colName) => colName.toLowerCase() === c.toLowerCase()) || c;
    };

    // Check if dropped on a column (droppable area)
    const targetColumnByOver = columns.find((col) => col === overId) || toColumnKey(overId);
    if (targetColumnByOver && columnToStatus[targetColumnByOver]) {
      const newStatus = columnToStatus[targetColumnByOver];
      if (newStatus !== currentStatus) {
        onStatusChange?.(activeId, newStatus);
      }
      return;
    }

    // Check if dropped on another task — use that task's column
    const targetTask = tasks.find((task) => task.id === overId);
    if (targetTask) {
      const targetColumn = toColumnKey(targetTask.column) || targetTask.column;
      const newStatus = columnToStatus[targetColumn];

      if (newStatus && newStatus !== currentStatus) {
        onStatusChange?.(activeId, newStatus);
      }
    }
  };

  const activeTask = activeId
    ? tasks.find((task) => task.id === activeId)
    : null;

  // Group tasks by column
  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column] = tasks.filter((task) => task.column === column);
    return acc;
  }, {});

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <DroppableColumn
            key={column}
            column={column}
            tasks={tasksByColumn[column] || []}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            processingTasks={processingTasks}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5 shadow-xl opacity-95 rotate-1 w-[280px]">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
              {activeTask.title}
            </p>
            {activeTask.description && (
              <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                {activeTask.description}
              </p>
            )}
            {activeTask.property && (
              <p className="mt-2 text-xs text-slate-600 font-medium truncate">
                📍 {activeTask.property}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
