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
import GoogleSessionButton from "@/components/googleSessionButton";
import ReCAPTCHA from "react-google-recaptcha";
import { Severity } from "@/types/errorTypes";

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
  const [reCAPTCHAPassed, setReCAPTCHAPassed] = useState<boolean>(false);
  const [reCAPTCHAError, setReCAPTCHAError] = useState<boolean>(false);
  const [passwordMatchError, setPasswordMatchError] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<boolean>(false);

  function handleBackButtonClicked() {
    const nextPage = JSON.parse(context)?.next as PageName;
    if (
      nextPage &&
      nextPage !== "yourListings" &&
      nextPage !== "yourBiddings" &&
      nextPage !== "create" &&
      nextPage !== "editAuction" &&
      nextPage !== "watchList"
    ) {
      setCurPage(nextPage, context);
    } else {
      setCurPage("home");
    }
  }

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!reCAPTCHAPassed) {
      setToast({
        message: "Please complete the captcha",
        severity: Severity.Warning,
      });
      setReCAPTCHAError(true);

      return;
    }

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    const username = (
      e.currentTarget.elements.namedItem("username") as HTMLInputElement
    ).value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;
    const confirmPassword = (
      e.currentTarget.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    const emailRegex = new RegExp(
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    );
    if (!emailRegex.test(email)) {
      setEmailError(true);
      return;
    }

    if (password !== confirmPassword) {
      setToast({
        message: "Passwords do not match",
        severity: Severity.Warning,
      });
      setPasswordMatchError(true);
      return;
    }

    fetchSignup(setToast, username, password, email).then(
      (loginData: User | null) => {
        if (!loginData) {
          setSubmitError(true);
          return;
        }

        setUser({
          accountId: loginData.accountId,
          username,
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
          <IconButton onClick={() => handleBackButtonClicked()}>
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
            error={emailError}
            onChange={() => {
              setEmailError(false);
              setSubmitError(false);
            }}
            helperText={
              emailError ? "Email must have a valid email format." : undefined
            }
          />

          <label
            htmlFor="username"
            className={`${styles.label} ${styles.required}`}
          >
            Username
          </label>
          <TextField
            id="username"
            size="small"
            placeholder="Enter your username"
            variant="outlined"
            required
            autoComplete="off"
            onChange={() => setSubmitError(false)}
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
            onChange={() => setSubmitError(false)}
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
            onChange={() => {
              setSubmitError(false);
              setPasswordMatchError(false);
            }}
          />

          <div
            className={styles.recaptcha}
            style={{ borderColor: reCAPTCHAError ? "red" : "transparent" }}
          >
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_KEY as string}
              onChange={() => {
                setReCAPTCHAPassed(true);
                setReCAPTCHAError(false);
              }}
            />
          </div>

          <Button
            variant="contained"
            type="submit"
            sx={{ marginTop: "20px", marginBottom: "15px" }}
          >
            Sign up
          </Button>

          {submitError && (
            <p className={styles.session_error_text}>
              Username / password was invalid or account already exists.
            </p>
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
        <Image
          src="/mtg-banner-3.jpg"
          alt="SuperBiddo"
          priority
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "bottom",
          }}
        />
      </motion.div>
    </motion.main>
  );
}
