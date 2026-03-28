import { isAxiosError } from 'axios';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';

const looksInternalMessage = (text: string) => {
  const normalized = text.toLowerCase();
  return (
    normalized.includes('exception') ||
    normalized.includes('stack') ||
    normalized.includes('trace') ||
    normalized.includes('mongodb') ||
    normalized.includes('mongoose') ||
    normalized.includes('sql') ||
    normalized.includes('prisma')
  );
};

const normalizeMessage = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (looksInternalMessage(trimmed)) return null;
    return trimmed;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeMessage(item);
      if (normalized) return normalized;
    }
  }

  return null;
};

export function getUserFriendlyErrorMessage(error: unknown, fallback?: string): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const dataMessage = normalizeMessage(error.response?.data?.message);

    if (status && status >= 500) {
      return SERVER_ERROR_MESSAGE;
    }

    if (dataMessage) {
      return dataMessage;
    }

    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (status === 403) {
      return 'You are not allowed to perform this action.';
    }

    if (status === 404) {
      return 'The requested resource was not found.';
    }

    if (status === 429) {
      return 'Too many requests. Please wait and try again.';
    }

    if (!error.response) {
      return 'Unable to connect. Please check your internet connection.';
    }
  }

  if (error instanceof Error) {
    const msg = normalizeMessage(error.message);
    if (msg) {
      return msg;
    }
  }

  return fallback ?? GENERIC_ERROR_MESSAGE;
}
