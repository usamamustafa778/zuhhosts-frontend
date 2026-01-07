"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { useState } from "react";

const columns = ["Pending", "In Progress", "Completed", "Cancelled"];

// Map column names to status values
const columnToStatus = {
  "Pending": "pending",
  "In Progress": "in_progress",
  "Completed": "completed",
  "Cancelled": "cancelled",
};

// Map status values to column names
const statusToColumn = {
  "pending": "Pending",
  "in_progress": "In Progress",
  "in-progress": "In Progress",
  "completed": "Completed",
  "complete": "Completed",
  "cancelled": "Cancelled",
  "canceled": "Cancelled",
};

function SortableTask({ task, column, onComplete, isProcessing }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: isProcessing, // Disable dragging while processing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isProcessing ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isProcessing ? {} : attributes)}
      {...(isProcessing ? {} : listeners)}
      className={`rounded-2xl border p-3 hover:shadow-sm transition-shadow relative ${
        isProcessing 
          ? "border-blue-300 bg-blue-50/50 cursor-wait" 
          : "border-slate-100 bg-slate-50/70 cursor-grab active:cursor-grabbing"
      }`}
    >
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10 pointer-events-none">
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-medium">Updating...</span>
          </div>
        </div>
      )}
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
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(task.id);
            }}
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
  );
}

function DroppableColumn({ column, tasks, onComplete, processingTasks = [] }) {
  const taskIds = tasks.map((task) => task.id);
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border p-4 shadow-sm transition-colors ${
        isOver
          ? "border-blue-300 bg-blue-50/50"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-600">{column}</h4>
        <span className="text-xs text-slate-400">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="mt-3 space-y-3">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              column={column}
              onComplete={onComplete}
              isProcessing={processingTasks.includes(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ tasks = [], onComplete, onStatusChange, processingTasks = [] }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
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

    // Normalize current status
    const normalizeStatus = (status) => {
      if (!status) return "pending";
      const normalized = status.toLowerCase().trim();
      if (normalized === "in-progress") return "in_progress";
      if (normalized === "complete") return "completed";
      if (normalized === "canceled") return "cancelled";
      return normalized;
    };

    const currentStatus = normalizeStatus(draggedTask.status);

    // Check if dropped on a column (droppable area)
    const targetColumn = columns.find((col) => col === overId);
    if (targetColumn) {
      const newStatus = columnToStatus[targetColumn];
      
      // Only update if status actually changed
      if (newStatus && newStatus !== currentStatus) {
        onStatusChange?.(activeId, newStatus);
      }
      return;
    }

    // Check if dropped on another task - find which column it belongs to
    const targetTask = tasks.find((task) => task.id === overId);
    if (targetTask) {
      const targetColumn = targetTask.column;
      const newStatus = columnToStatus[targetColumn];
      
      // Only update if status actually changed
      if (newStatus && newStatus !== currentStatus) {
        onStatusChange?.(activeId, newStatus);
      }
    }
  };

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

  // Group tasks by column
  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column] = tasks.filter((task) => task.column === column);
    return acc;
  }, {});

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <DroppableColumn
            key={column}
            column={column}
            tasks={tasksByColumn[column] || []}
            onComplete={onComplete}
            processingTasks={processingTasks}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg opacity-90 rotate-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">{activeTask.title}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${
                activeTask.status === "completed" ? "bg-green-100 text-green-700" :
                activeTask.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                activeTask.status === "cancelled" ? "bg-rose-100 text-rose-700" :
                "bg-slate-100 text-slate-700"
              }`}>
                {activeTask.status === "completed" ? "Done" :
                 activeTask.status === "in_progress" ? "Active" :
                 activeTask.status === "cancelled" ? "Cancelled" :
                 "Pending"}
              </span>
            </div>
            {activeTask.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{activeTask.description}</p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

