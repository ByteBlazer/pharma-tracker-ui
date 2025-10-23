import { BackupFile } from "./BackupFile";

export interface BackupListResponse {
  success: boolean;
  backups: BackupFile[];
  count: number;
}
