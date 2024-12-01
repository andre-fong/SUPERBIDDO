import { ReactNode } from "react";

export type PageName =
  | "home"
  | "results"
  | "login"
  | "signup"
  | "auction"
  | "create"
  | "createAuction"
  | "yourListings"
  | "yourBiddings"
  | "editAuction"
  | "watchList";
export type PageData = Record<
  PageName,
  { title: string; component: ReactNode }
>;
