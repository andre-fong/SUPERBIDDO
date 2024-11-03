import { ReactNode } from "react";

export type PageName =
  | "home"
  | "login"
  | "signup"
  | "bids"
  | "auction"
  | "profile";
export type PageData = Record<
  PageName,
  { title: string; component: ReactNode }
>;
