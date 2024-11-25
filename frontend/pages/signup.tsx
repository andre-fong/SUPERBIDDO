import { PageName } from "@/types/pageTypes";
import React, { useState } from "react";
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
import { useRef } from "react";
import GoogleSessionButton from "@/components/googleSessionButton";
import ReCAPTCHA from "react-google-recaptcha";
import { Severity } from "@/types/errorTypes";

const enableCaptcha = false;

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
  const recaptchaRef = useRef<boolean>(false);

  const [passwordMatchError, setPasswordMatchError] = useState<boolean>(false);

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (enableCaptcha && !recaptchaRef.current) {
      setToast({
        message: "Please complete the captcha",
        severity: Severity.Warning,
      });
      return;
    }

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;
    const confirmPassword = (
      e.currentTarget.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    if (password !== confirmPassword) {
      setToast({
        message: "Passwords do not match",
        severity: Severity.Warning,
      });
      setPasswordMatchError(true);
      return;
    }

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
            helperText="Password must be 8-50 characters long, contain at least 1 uppercase letter, 1 lowercase letter, and 1 number."
          />

          <label
            htmlFor="confirmPassword"
            className={`${styles.label} ${styles.required}`}
          >
            Confirm Password
          </label>
          <TextField
            id="confirmPassword"
            size="small"
            placeholder="Enter your password again"
            variant="outlined"
            type="password"
            required
            autoComplete="off"
            error={passwordMatchError}
            helperText={passwordMatchError ? "Passwords do not match." : ""}
          />

          <Button
            variant="contained"
            type="submit"
            sx={{ marginTop: "10%", marginBottom: "10px" }}
          >
            Sign up
          </Button>
          {enableCaptcha && (
            <ReCAPTCHA
              sitekey={""}
              onChange={() => (recaptchaRef.current = true)}
            />
          )}
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
