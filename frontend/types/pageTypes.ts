import { ReactNode } from "react";

export type PageName =
  | "home"
  | "results"
  | "login"
  | "signup"
  | "auction"
  | "create"
  | "yourListings"
  | "yourBiddings"
  | "editAuction"
  | "watchList";
export type PageData = Record<
  PageName,
  { title: string; component: ReactNode }
>;
