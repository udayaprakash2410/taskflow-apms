import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { useWorkspace } from "../Context/WorkspaceContext";

const weekdayNames = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export default function Calendar() {
  const { role, token } = useWorkspace();
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date()
  );
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (
      !token ||
      (role !== "employee" && role !== "manager")
    ) {
      return;
    }

    let isCurrent = true;

    const loadTasks = async () => {
      try {
        const response = await fetch(
          role === "employee"
            ? "http://localhost:5000/api/tasks/my"
            : "http://localhost:5000/api/tasks",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load tasks.");
        }

        if (isCurrent) {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Calendar tasks error:", error);

        if (isCurrent) {
          setTasks([]);
        }
      }
    };

    loadTasks();

    return () => {
      isCurrent = false;
    };
  }, [role, token]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from(
        { length: numberOfDays },
        (_, index) => index + 1
      ),
    ];
  }, [currentMonth]);

  const tasksByDay = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return tasks.reduce((groupedTasks, task) => {
      if (!task.dueDate) {
        return groupedTasks;
      }

      const dueDate = new Date(task.dueDate);

      if (
        dueDate.getFullYear() !== year ||
        dueDate.getMonth() !== month
      ) {
        return groupedTasks;
      }

      const day = dueDate.getDate();
      groupedTasks[day] = [
        ...(groupedTasks[day] || []),
        task,
      ];

      return groupedTasks;
    }, {});
  }, [currentMonth, tasks]);

  const monthLabel = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const isToday = (day) => {
    const today = new Date();

    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const changeMonth = (offset) => {
    setCurrentMonth(
      (month) =>
        new Date(month.getFullYear(), month.getMonth() + offset, 1)
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your deadlines and important dates.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={17} />
          Add event
        </button>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{monthLabel}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
              className="rounded-lg border border-slate-200 p-2"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
              className="rounded-lg border border-slate-200 p-2"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400">
          {weekdayNames.map((day) => (
            <span key={day} className="py-2">
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-slate-100">
          {calendarDays.map((day, index) => {
            const dayTasks = day ? tasksByDay[day] || [] : [];

            return (
              <div
                key={`${day || "empty"}-${index}`}
                className="min-h-20 border-b border-r border-slate-100 p-2 text-sm text-slate-600"
              >
                {day && (
                  <>
                    <span
                      className={
                        isToday(day)
                          ? "grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-white"
                          : ""
                      }
                    >
                      {day}
                    </span>
                    {dayTasks.slice(0, 2).map((task) => (
                      <p
                        key={task._id}
                        title={task.title}
                        className="mt-2 truncate rounded bg-violet-50 px-1 py-0.5 text-[10px] text-violet-700"
                      >
                        {task.title}
                      </p>
                    ))}
                    {dayTasks.length > 2 && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        +{dayTasks.length - 2} more
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
