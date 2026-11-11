export interface UserRecord {
  email: string;
  matkhau: string;
  hoten: string;
  hinhanh: string;
}
// Password hashes must never be returned to the application.
export type PublicUser = Omit<UserRecord, "matkhau"> & {
  id: string;
};
