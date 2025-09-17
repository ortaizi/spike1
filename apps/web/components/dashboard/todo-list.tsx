'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'לשלוח מייל למרצה', completed: false },
    { id: 2, text: 'להתכונן למצגת בקורס סטטיסטיקה', completed: false },
    { id: 3, text: 'לקרוא פרק 4 בספר האלגברה', completed: true },
    { id: 4, text: 'להגיש טופס בקשה למלגה', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      const newTaskObj: Task = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
      };
      setTasks([...tasks, newTaskObj]);
      setNewTask('');
    }
  };

  const handleToggleTask = (id: number) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // const handleQuickAdd = () => {
  //   const text = prompt('הכנס משימה חדשה:');
  //   if (text && text.trim()) {
  //     const newTaskObj: Task = {
  //       id: Date.now(),
  //       text: text.trim(),
  //       completed: false,
  //     };
  //     setTasks([...tasks, newTaskObj]);
  //   }
  // }; // Reserved for future use

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  return (
    <>
      {/* Progress Info */}
      <div className='mb-4'>
        <p className='dipy-description'>
          {completedCount} מתוך {totalCount} הושלמו
        </p>
        {totalCount > 0 && (
          <div className='mt-2'>
            <div className='h-2 rounded-full bg-slate-200'>
              <div
                className='h-2 rounded-full bg-emerald-500 transition-all duration-500'
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Input */}
      <div className='mb-4 flex space-x-2 space-x-reverse'>
        <input
          type='text'
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder='הוסף משימה חדשה...'
          className='dipy-input text-sm'
          onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <button
          onClick={handleAddTask}
          disabled={!newTask.trim()}
          className='dipy-button dipy-button-primary whitespace-nowrap px-4 py-2 text-sm'
        >
          הוסף
        </button>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className='dipy-empty-state py-8'>
          <div className='mb-3 text-4xl'>✨</div>
          <p className='dipy-empty-state-title text-base'>אין משימות כרגע</p>
          <p className='dipy-empty-state-description'>הוסף משימה חדשה כדי להתחיל</p>
        </div>
      ) : (
        <div className='max-h-96 space-y-2 overflow-y-auto'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center space-x-3 space-x-reverse rounded-lg border p-3 transition-all duration-200 ${
                task.completed
                  ? 'border-emerald-200/50 bg-emerald-50/50'
                  : 'border-slate-200/50 bg-slate-50/50 hover:bg-emerald-50/30'
              }`}
            >
              <input
                type='checkbox'
                checked={task.completed}
                onChange={() => handleToggleTask(task.id)}
                className='h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-2 focus:ring-emerald-500'
              />
              <span
                className={`flex-1 text-sm transition-all duration-200 ${
                  task.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className='rounded p-1 text-slate-400 transition-colors duration-200 hover:text-red-600'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {tasks.length > 0 && (
        <div className='mt-4 border-t border-slate-200 pt-4'>
          <div className='flex justify-between text-sm text-slate-600'>
            <span>סה"כ משימות: {totalCount}</span>
            <span>הושלמו: {completedCount}</span>
          </div>
        </div>
      )}
    </>
  );
}
