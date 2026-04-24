// src/api/client.ts
import axios from 'axios';

// Define la URL base de tu backend
const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Si necesitas enviar cookies o tokens de autenticación
    withCredentials: true, 
});