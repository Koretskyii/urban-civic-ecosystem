import { AUTH_PROVIDERS } from "../constants/auth.const.js";

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];