import { PageName } from "@/types/pageTypes";
import React from "react";
import styles from "@/styles/login.module.css";

export default function Login({
  setCurPage,
}: {
  setCurPage: (page: PageName) => void;
}) {
  function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCurPage("home");
  }

  return (
    <main className={styles.main}>
      <form className={styles.container} onSubmit={handleLoginSubmit}>
        <h1 className={styles.title}>Login</h1>
        <input type="text" placeholder="Username" className={styles.input} />
        <input
          type="password"
          placeholder="Password"
          className={styles.input}
        />
        <button className={styles.button} type="submit">
          Login
        </button>
      </form>
    </main>
  );
}
