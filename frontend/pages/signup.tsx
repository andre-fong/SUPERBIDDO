import { PageName } from "@/types/pageTypes";
import React from "react";
import styles from "@/styles/login.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { fetchSignup } from "@/utils/fetchFunctions";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNew";
import { motion } from "motion/react";
import { ErrorType } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import GoogleSessionButton from "@/components/googleSessionButton";

export default function Signup({
  setCurPage,
  context,
  setToast,
  setUser,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  context: string;
  setToast: (error: ErrorType) => void;
  setUser: (user: User) => void;
}) {
  // TODO: Save previous action and redirect to it after signup
  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;

    fetchSignup(setToast, email.split("@")[0], password, email).then(
      (loginData) => {
        if (!loginData) {
          return;
        }

        setUser({
          accountId: loginData.accountId,
          username: email.split("@")[0],
          email,
        });
        setCurPage((JSON.parse(context)?.next as PageName) || "home", context);
      }
    );
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

        <form className={styles.form_container} onSubmit={handleSignupSubmit}>
          <Image
            src="/superbiddo-icon.svg"
            alt="SuperBiddo icon"
            width={40}
            height={40}
          />

          <h2 className={styles.title}>Nice to meet you!</h2>
          <p className={styles.subtitle}>
            Sign up to continue using all of SuperBiddo&apos;s features.
          </p>

          <label
            htmlFor="email"
            className={`${styles.label} ${styles.required}`}
          >
            Email
          </label>
          <TextField
            id="email"
            size="small"
            placeholder="Enter your email"
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
            Sign up
          </Button>
        </form>

        <div className={styles.divider_container}>
          <div className={styles.divider} />
          <p className={styles.divider_text}>Or, login with</p>
          <div className={styles.divider} />
        </div>

        {/* OAUTH */}
        <div className={styles.oauth_container}>
          <GoogleSessionButton />
        </div>

        <p className={styles.redirect_text}>
          Already have an account?{" "}
          <button
            className={styles.link}
            onClick={() => setCurPage("login", context)}
          >
            Login here
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
