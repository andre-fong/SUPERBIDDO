import Image from "next/image";
import styles from "./page.module.css";
import dynamic from "next/dynamic";

const CreateBid = dynamic(() => import("@/pages/createbid"));

export default function Home() {
  return <CreateBid />;
}
