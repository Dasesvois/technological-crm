export interface User {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

export interface LoginResponse {
    token: string;
    user: User;
}

// DTO (data transfer object) для отправки на сервер при логине.
export interface LoginPayload {
    email: string;
    password: string;
}