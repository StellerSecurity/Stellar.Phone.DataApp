import { SecretFile } from './secretfile';

export class Secret {
    id: string = '';
    message: string = '';
    expires_at: string = '';

    // Backend flag: only tells the API whether a password was used.
    has_password: boolean = false;

    // Client-only: used for local encryption key input.
    // Must NEVER be sent to the backend.
    password?: string = '';

    files?: SecretFile[] = [];
}
