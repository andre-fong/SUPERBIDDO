import { ReactNode } from "react";

export type PageName =
  | "home"
  | "login"
  | "signup"
  | "auction"
  | "profile"
  | "create";
export type PageData = Record<
  PageName,
  { title: string; component: ReactNode }
>;
