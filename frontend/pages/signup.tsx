import { PageName } from "@/types/pageTypes";
import React from "react";
import styles from "@/styles/login.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { fetchLogin } from "@/utils/fetchFunctions";

export default function Signup({
  setCurPage,
}: {
  setCurPage: (page: PageName) => void;
}) {
  // TODO: Save previous action and redirect to it after signup
  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: SIGNUP LOGIC HERE!
    // await fetchSignup();
    setCurPage("home");
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <form className={styles.form_container} onSubmit={handleSignupSubmit}>
          {/* LOGO */}

          <h2 className={styles.title}>Nice to meet you!</h2>
          <p className={styles.subtitle}>
            Sign up to continue using all of SuperBiddo&apos;s features.
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
            Sign up
          </Button>
        </form>

        <div className={styles.divider_container}>
          <div className={styles.divider} />
          <p className={styles.divider_text}>Or, login with</p>
          <div className={styles.divider} />
        </div>

        {/* OAUTH */}

        <p className={styles.redirect_text}>
          Already have an account?{" "}
          <button className={styles.link} onClick={() => setCurPage("login")}>
            Login here
          </button>
        </p>
      </div>

      <div className={styles.image_container}>
        <img
          src="https://images2.alphacoders.com/136/thumb-1920-1368422.jpeg"
          alt="SuperBiddo"
          className={styles.TEMP_img}
        />
      </div>
    </main>
  );
}
