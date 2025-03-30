import "./globals.css";

export const metadata = {
  title: "Calico",
  description: "Proyecto de monitorías",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
