import "./globals.css";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

/**
 * Change tab title of current page
 * @param title New page title
 */
export function changePageTitle(title: string) {
  document.title = title;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ backgroundColor: "rgb(250, 250, 250)" }}
      >
        {children}
      </body>
    </html>
  );
}
