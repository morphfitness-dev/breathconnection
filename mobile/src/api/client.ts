import axios from 'axios';

const BASE_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://api.breathconnection.com/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export async function register(email: string, password: string, name?: string) {
  const { data } = await api.post('/auth/register', { email, password, name });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function submitAssessment(assessment: Record<string, unknown>) {
  const { data } = await api.post('/assessment', assessment);
  return data;
}

export async function getAssessment() {
  const { data } = await api.get('/assessment');
  return data;
}

export async function getTodaySession() {
  const { data } = await api.get('/sessions/today');
  return data;
}

export async function startSession(videoId: string) {
  const { data } = await api.post('/sessions/start', { videoId });
  return data;
}

export async function completeSession(payload: Record<string, unknown>) {
  const { data } = await api.post('/sessions/complete', payload);
  return data;
}

export async function getSessionHistory() {
  const { data } = await api.get('/sessions/history');
  return data;
}

export async function getProgramme() {
  const { data } = await api.get('/programme');
  return data;
}

export async function getVideos() {
  const { data } = await api.get('/programme/videos');
  return data;
}

export async function getDashboard() {
  const { data } = await api.get('/metrics/dashboard');
  return data;
}

export async function logMetric(metric: Record<string, unknown>) {
  const { data } = await api.post('/metrics', metric);
  return data;
}

export async function getWearables() {
  const { data } = await api.get('/wearables');
  return data;
}

export async function connectWearable(deviceType: string, tokens?: Record<string, string>) {
  const { data } = await api.post('/wearables/connect', { deviceType, ...tokens });
  return data;
}

export async function getGamificationProfile() {
  const { data } = await api.get('/gamification/profile');
  return data;
}

export async function getMilestones() {
  const { data } = await api.get('/gamification/milestones');
  return data;
}

export async function getBoltLeaderboard() {
  const { data } = await api.get('/gamification/bolt-leaderboard');
  return data;
}
