import { ReactNode } from "react";

export type PageName =
  | "home"
  | "results"
  | "login"
  | "signup"
  | "auction"
  | "profile"
  | "create"
  | "yourListings"
  | "yourBiddings"
  | "editAuction";
export type PageData = Record<
  PageName,
  { title: string; component: ReactNode }
>;
