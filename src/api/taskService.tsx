// src/api/tasksService.ts
import { apiClient } from './client';

// Define la interfaz para el tipo de datos que esperas (más abajo se detalla)
export interface Task {
    id: number;
    title: string;
    description: string;
    is_done: boolean;
}

export const tasksService = {
    // Obtener todas las tareas
    getTasks: async (): Promise<Task[]> => {
        const response = await apiClient.get<Task[]>('/tasks');
        return response.data;
    },

    // Crear una nueva tarea
    createTask: async (taskData: Omit<Task, 'id'>): Promise<Task> => {
        const response = await apiClient.post<Task>('/tasks', taskData);
        return response.data;
    },
};