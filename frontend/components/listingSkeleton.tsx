import React from "react";
import Skeleton from "@mui/material/Skeleton";
import styles from "@/styles/results.module.css";

export default function ListingSkeleton() {
  return (
    <div className={styles.skeleton}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={300}
        sx={{ borderRadius: "10px" }}
      />
      <Skeleton width="100%" sx={{ marginTop: "15px", fontSize: "1.3rem" }} />
      <Skeleton width="100%" sx={{ marginTop: "3px", fontSize: "1.3rem" }} />
      <Skeleton width="50%" sx={{ marginTop: "5px", fontSize: "0.9rem" }} />
      <div className={styles.skeleton_price_row}>
        <Skeleton
          width="30%"
          sx={{ fontSize: "2.2rem", marginRight: "15px" }}
        />
        <Skeleton width={50} height={25} />
      </div>

      <Skeleton width="50%" sx={{ marginTop: "3px", fontSize: "0.9rem" }} />
      <Skeleton width="50%" sx={{ marginTop: "3px", fontSize: "0.9rem" }} />
    </div>
  );
}
