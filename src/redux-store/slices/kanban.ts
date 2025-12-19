import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { KanbanType, ColumnType, TaskType } from '@/types/apps/kanbanTypes'

const initialState: KanbanType = {
  columns: [],
  tasks: [],
  currentTaskId: undefined
}

export const kanbanSlice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    addColumn: (state, action: PayloadAction<ColumnType>) => {
      state.columns.push(action.payload)
    },
    updateColumns: (state, action: PayloadAction<ColumnType[]>) => {
      state.columns = action.payload
    },
    editColumn: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const column = state.columns.find(col => col.id === action.payload.id)
      if (column) {
        column.title = action.payload.title
      }
    },
    deleteColumn: (state, action: PayloadAction<number>) => {
      state.columns = state.columns.filter(col => col.id !== action.payload)
    },
    updateColumnTaskIds: (state, action: PayloadAction<{ columnId: number; taskIds: number[] }>) => {
      const column = state.columns.find(col => col.id === action.payload.columnId)
      if (column) {
        column.taskIds = action.payload.taskIds
      }
    },
    addTask: (state, action: PayloadAction<TaskType>) => {
      state.tasks.push(action.payload)
    },
    editTask: (state, action: PayloadAction<TaskType>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id)
      if (index !== -1) {
        state.tasks[index] = action.payload
      }
    },
    deleteTask: (state, action: PayloadAction<number>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload)
      state.columns.forEach(column => {
        column.taskIds = column.taskIds.filter(taskId => taskId !== action.payload)
      })
    },
    getCurrentTask: (state, action: PayloadAction<number>) => {
      state.currentTaskId = action.payload
    }
  }
})

export const {
  addColumn,
  updateColumns,
  editColumn,
  deleteColumn,
  updateColumnTaskIds,
  addTask,
  editTask,
  deleteTask,
  getCurrentTask
} = kanbanSlice.actions

export default kanbanSlice.reducer
