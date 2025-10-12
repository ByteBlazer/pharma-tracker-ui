export interface BackupFile {
  filename: string;
  lastModified: string;
  size: number;
}

export interface BackupListResponse {
  success: boolean;
  backups: BackupFile[];
  count: number;
}

export interface CreateBackupResponse {
  success: boolean;
  message: string;
  filename: string;
}

export interface RestoreBackupRequest {
  filename: string;
  passkey: string;
}

export interface RestoreBackupResponse {
  success: boolean;
  message: string;
}
