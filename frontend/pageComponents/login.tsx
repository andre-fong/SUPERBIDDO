import { PageName } from "@/types/pageTypes";
import React, { useState } from "react";
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
import GoogleSessionButton from "@/components/googleSessionButton";
import ReCAPTCHA from "react-google-recaptcha";
import { Severity } from "@/types/errorTypes";

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
  const [reCAPTCHAPassed, setReCAPTCHAPassed] = useState<boolean>(false);
  const [reCAPTCHAError, setReCAPTCHAError] = useState<boolean>(false);
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

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;

    const emailRegex = new RegExp(
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    );
    if (!emailRegex.test(email)) {
      setEmailError(true);
      return;
    }

    fetchLogin(setToast, email, password).then((loginData: User | null) => {
      if (!loginData) {
        setSubmitError(true);
        return;
      }

      setUser({
        accountId: loginData.accountId,
        username: loginData.username,
        email,
        address: loginData.address,
      });
      setCurPage((JSON.parse(context)?.next as PageName) || "home", context);
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
          <IconButton onClick={() => handleBackButtonClicked()}>
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
            onChange={() => setSubmitError(false)}
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
            sx={{ marginTop: "7%", marginBottom: "15px" }}
          >
            Log in
          </Button>

          {submitError && (
            <p className={styles.session_error_text}>
              Email or password is incorrect.
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
        <Image
          src="/pokemon-banner-2.jpg"
          alt="SuperBiddo"
          priority
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </motion.div>
    </motion.main>
  );
}
