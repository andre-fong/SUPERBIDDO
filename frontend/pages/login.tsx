import { PageName } from "@/types/pageTypes";
import React from "react";
import styles from "@/styles/login.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { fetchLogin } from "@/utils/fetchFunctions";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNew";
import { motion } from "motion/react";
import { User } from "@/types/userTypes";
import { ErrorType } from "@/types/errorTypes";

export default function Login({
  setCurPage,
  context,
  setUser,
  setToast,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  context: string;
  setUser: (user: User) => void;
  setToast: (error: ErrorType) => void;
}) {
  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    //This is for logging in with Google OAuth
    //window.location.href = 'http://localhost:3001/api/v1/oauth/google';
    
    const username = (
      e.currentTarget.elements.namedItem("username") as HTMLInputElement
    ).value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;

    fetchLogin(setToast, username, password).then((loginData) => {
      if (!loginData) {
        return;
      }

      setUser({
        accountId: loginData.accountId,
        username: username,
        email: `${username}@gmail.com`,
      });
      setCurPage((JSON.parse(context)?.next as PageName) || "home");
    });
  }

  return (
    <motion.main className={styles.main}>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: "-10px" }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
      >
        <div className={styles.back}>
          <IconButton
            onClick={() =>
              setCurPage((JSON.parse(context)?.next as PageName) || "home")
            }
          >
            <ArrowBackIcon />
          </IconButton>
        </div>

        <form className={styles.form_container} onSubmit={handleLoginSubmit}>
          <Image
            src="/superbiddo-icon.svg"
            alt="SuperBiddo icon"
            width={40}
            height={40}
          />

          <h2 className={styles.title}>Welcome back!</h2>
          <p className={styles.subtitle}>
            Log in to continue using all of SuperBiddo&apos;s features.
          </p>

          <label
            htmlFor="username"
            className={`${styles.label} ${styles.required}`}
          >
            Username
          </label>
          <TextField
            id="username"
            size="small"
            placeholder="Enter your email / username"
            variant="outlined"
            required
            autoComplete="off"
          />

          <label
            htmlFor="password"
            className={`${styles.label} ${styles.required}`}
          >
            Password
          </label>
          <TextField
            id="password"
            size="small"
            placeholder="Enter your password"
            variant="outlined"
            type="password"
            required
            autoComplete="off"
          />

          <Button variant="contained" type="submit" sx={{ marginTop: "20px" }}>
            Log in
          </Button>
        </form>

        <div className={styles.divider_container}>
          <div className={styles.divider} />
          <p className={styles.divider_text}>Or, login with</p>
          <div className={styles.divider} />
        </div>

        {/* OAUTH */}

        <p className={styles.redirect_text}>
          Don&apos;t have an account?{" "}
          <button
            className={styles.link}
            onClick={() => setCurPage("signup", context)}
          >
            Register here
          </button>
        </p>
      </motion.div>

      <motion.div
        className={styles.image_container}
        initial={{ opacity: 0, y: "-10px" }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
      >
        <img
          src="https://images2.alphacoders.com/136/thumb-1920-1368422.jpeg"
          alt="SuperBiddo"
          className={styles.TEMP_img}
        />
      </motion.div>
    </motion.main>
  );
}
