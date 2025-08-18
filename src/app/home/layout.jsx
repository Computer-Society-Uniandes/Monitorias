import Header from "../components/Header/Header"
import "../globals.css";

export default function Layout({children}) {
    return(
        < >
        <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap"
            rel="stylesheet"
            />
            <Header suppressHydrationWarning/>
            {children}
        </>
    );
}