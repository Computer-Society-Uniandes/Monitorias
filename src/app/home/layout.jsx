import Header from "../components/Header"
import "../globals.css";

export default function Layout({children}) {
    return(
        <>
            <Header />
            {children}
        </>
    );
}