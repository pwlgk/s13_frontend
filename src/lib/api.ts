// src/lib/api.ts
import axios from 'axios';
import { useUserStore } from '@/store/user-store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена в каждый запрос
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Улучшенный Interceptor для обработки ответов
api.interceptors.response.use(
  // Если ответ успешный, просто возвращаем его
  (response) => response,
  
  // Если в ответе ошибка
  (error) => {
    // Проверяем, есть ли вообще объект ответа от сервера
    if (error.response) {
      const { status, data } = error.response;
      
      // 1. Проверяем на статус 403 (общая блокировка)
      const isForbidden = status === 403;
      // 2. Проверяем на конкретное сообщение в теле ответа
      const isBlockedDetail = data?.detail === "User is blocked";

      if (isForbidden || isBlockedDetail) {
        // Если выполняется любое из условий, считаем пользователя заблокированным
        console.warn(`User is blocked. Reason: ${isForbidden ? 'Status 403' : 'Detail message'}.`);
        
        const { user, updateLocalUser } = useUserStore.getState();

        // Обновляем статус пользователя локально, чтобы UI отреагировал
        if (user && !user.is_blocked) {
          updateLocalUser({ is_blocked: true });
        }
      }
    }
    
    // Важно: всегда возвращаем ошибку, чтобы useMutation().onError мог ее обработать
    // и показать локальное сообщение (например, "Не удалось сохранить профиль")
    return Promise.reject(error);
  }
);