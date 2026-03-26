'use client';

import { type AuthUser } from '@shared-types';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
	authService,
	type LoginPayload,
	type RegisterProfessionalPayload,
	type RegisterUserPayload,
	clearAccessToken,
} from '@/src/services/auth.service';

type AuthContextValue = {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	clearError: () => void;
	login: (payload: LoginPayload) => Promise<boolean>;
	registerUser: (payload: RegisterUserPayload) => Promise<boolean>;
	registerProfessional: (payload: RegisterProfessionalPayload) => Promise<boolean>;
	logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string => {
	if (
		typeof error === 'object' &&
		error !== null &&
		'response' in error &&
		typeof error.response === 'object' &&
		error.response !== null &&
		'data' in error.response &&
		typeof error.response.data === 'object' &&
		error.response.data !== null &&
		'message' in error.response.data
	) {
		const message = error.response.data.message;
		if (typeof message === 'string') return message;
		if (Array.isArray(message) && message.length > 0) return String(message[0]);
	}

	return 'Something went wrong. Please try again.';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const login = useCallback(async (payload: LoginPayload) => {
		setError(null);
		try {
			const auth = await authService.login(payload);
			setUser(auth.user);
			return true;
		} catch (e) {
			setError(getErrorMessage(e));
			return false;
		}
	}, []);

	const registerUser = useCallback(async (payload: RegisterUserPayload) => {
		setError(null);
		try {
			const auth = await authService.registerUser(payload);
			setUser(auth.user);
			return true;
		} catch (e) {
			setError(getErrorMessage(e));
			return false;
		}
	}, []);

	const registerProfessional = useCallback(
		async (payload: RegisterProfessionalPayload) => {
			setError(null);
			try {
				const auth = await authService.registerProfessional(payload);
				setUser(auth.user);
				return true;
			} catch (e) {
				setError(getErrorMessage(e));
				return false;
			}
		},
		[],
	);

	const logout = useCallback(async () => {
		setError(null);
		try {
			await authService.logout();
		} finally {
			clearAccessToken();
			setUser(null);
		}
	}, []);

	useEffect(() => {
		const initialize = async () => {
			try {
				const me = await authService.getMe();
				setUser(me);
			} catch {
				try {
					const auth = await authService.refresh();
					setUser(auth.user);
				} catch {
					clearAccessToken();
					setUser(null);
				}
			} finally {
				setIsLoading(false);
			}
		};

		void initialize();
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			isAuthenticated: Boolean(user),
			isLoading,
			error,
			clearError,
			login,
			registerUser,
			registerProfessional,
			logout,
		}),
		[clearError, error, isLoading, login, logout, registerProfessional, registerUser, user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

