import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import styles from "@/styles/locationEdit.module.css";

export default function locationEdit({
  locationEditOpen,
  setLocationEditOpen,
}: {
  locationEditOpen: boolean;
  setLocationEditOpen: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={locationEditOpen}
      onClose={() => setLocationEditOpen(false)}
      fullWidth
      disableScrollLock
    >
      <div className={styles.container}>
        <h2 className={styles.title}>Edit Location</h2>

        <TextField
          label="Location"
          variant="outlined"
          fullWidth
          placeholder="Enter your location"
        />

        <div className={styles.button_row}>
          <Button variant="outlined" onClick={() => setLocationEditOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
