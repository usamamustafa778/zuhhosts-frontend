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
import { useState, useEffect } from "react";

const columns = ["Pending", "In Progress", "Completed", "Cancelled"];

// Map column names to status values
const columnToStatus = {
  Pending: "pending",
  "In Progress": "in_progress",
  Completed: "completed",
  Cancelled: "cancelled",
};

function SortableTask({
  task,
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
    disabled: isProcessing, // Disable dragging while processing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isProcessing ? 0.7 : 1,
  };

  const isDropdownOpen = openDropdownId === task.id;

  // Close dropdown when clicking outside
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
      className={`rounded-2xl border p-3 hover:shadow-sm transition-shadow relative ${
        isProcessing
          ? "border-blue-300 bg-blue-50/50 cursor-wait"
          : "border-slate-100 bg-slate-50/70"
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

      {/* Drag handle area - applies drag listeners here instead of whole card */}
      <div
        {...(isProcessing ? {} : attributes)}
        {...(isProcessing ? {} : listeners)}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2 mb-1 pr-8">
          <p className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {task.description}
          </p>
        )}
        {task.property && (
          <p className="mt-2 text-xs text-slate-600 font-medium truncate">
            📍 {task.property}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7  shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
              {task.assignee?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-slate-600 truncate block font-medium">
                {task.assignee}
              </p>
              {task.createdAt && (
                <p className="text-[10px] text-slate-600 truncate block -mt-1">
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          {/* Payment details and actions dropdown - outside drag handle */}
          <div className="mt-2 flex items-center justify-end gap-2 relative">
            {task.payment && task.payment.amount !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-slate-600">
                <span className="font-medium">${task.payment.amount || 0}</span>
                <span className="text-slate-400">•</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                    (task.payment.status || "unpaid") === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {(task.payment.status || "unpaid") === "paid"
                    ? "Paid"
                    : "Unpaid"}
                </span>
              </div>
            )}

            {/* Actions Dropdown - Three dots icon */}
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
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-200 active:bg-slate-300 transition-colors pointer-events-auto"
              >
                <svg
                  className="w-4 h-4 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 bottom-8 z-30 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
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

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border p-4 shadow-sm transition-colors ${
        isOver ? "border-blue-300 bg-blue-50/50" : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-600">{column}</h4>
        <span className="text-xs text-slate-400">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="mt-3 space-y-3">
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
      activationConstraint: {
        distance: 8,
      },
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
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg opacity-90 rotate-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
                {activeTask.title}
              </p>
            </div>
            {activeTask.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {activeTask.description}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
