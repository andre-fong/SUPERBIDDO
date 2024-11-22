import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import React from "react";
import styles from "@/styles/home.module.css";

export default function Home({
  setCurPage,
  user,
  setToast,
  context,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  user: User | null;
  setToast: (err: ErrorType) => void;
  context: string;
}) {
  return (
    <>
      <div className={styles.hero}>home</div>
    </>
  );
}
