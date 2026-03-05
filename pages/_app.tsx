import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <header className="main-header">
        <div className="container nav-wrapper">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 className="logo" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Finance<span>Calculator</span>
            </h1>
          </Link>
          <nav className="nav-right">
            <ul className="nav-links">
              <li>
                <Link href="/" className={router.pathname === "/" ? "active" : ""}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/contact" className={router.pathname === "/contact" ? "active" : ""}>
                  Contact
                </Link>
              </li>
            </ul>
            <div className="global-language-switcher">
              <div id="google_translate_element"></div>
              <div className="custom-lang-status">KR</div>
            </div>
          </nav>
        </div>
      </header>

      <main id="app" className="container main-layout">
        <Component {...pageProps} />
      </main>

      <footer className="main-footer">
        <div className="container footer-content-wrapper">
          <div className="footer-left">
            <p>&copy; 2026 FinanceCalculator. Focused on Innovation & Alpha.</p>
          </div>
          <div className="footer-right">
            <Link href="/about">About</Link>
            <span className="footer-sep">|</span>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
