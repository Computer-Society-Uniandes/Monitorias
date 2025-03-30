import Header from "../components/Header"
import "../globals.css";

export default function Layout({children}) {
    return(
        <>
        <body
        >
            <Header />
            {children}
        </body>
        </>
    );
}