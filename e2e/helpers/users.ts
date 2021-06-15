export interface User {
  email: string;
  password: string;
}

export const user1: User = {
  email: process.env.USER1_EMAIL!,
  password: process.env.USER1_PASSWORD!,
};
