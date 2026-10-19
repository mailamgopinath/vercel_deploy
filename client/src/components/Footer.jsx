import React from "react";
import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-container">

                <div>
                    <h2 className="footer-brand">STYLEHUB</h2>

                    <p>
                        Good clothes, thoughtfully chosen. Find the pieces that feel like you.
                    </p>
                </div>

                <div className="footer-links">
                    <h3>Quick Links</h3>

                    <Link to="/#new-arrivals">New arrivals</Link>
                    <Link to="/#categories">Women</Link>
                    <Link to="/#categories">Men</Link>
                    <Link to="/#categories">Kids</Link>
                </div>

                <div className="footer-links">
                    <h3>Customer Service</h3>

                    <Link to="/#reviews">Contact Us</Link>
                    <Link to="/#reviews">FAQ</Link>
                    <Link to="/#reviews">Shipping &amp; delivery</Link>
                    <Link to="/#reviews">Returns</Link>
                </div>

                <div>
                    <h3>Follow Us</h3>

                    <p>Follow along for new arrivals, outfit ideas, and little everyday joys.</p>
                    <div className="footer-socials">
                        <a href="https://instagram.com" aria-label="Instagram">ig</a>
                        <a href="https://pinterest.com" aria-label="Pinterest">p</a>
                    </div>
                </div>

            </div>

            {/* <div className="copyright">

                <span>© 2026 STYLEHUB. All rights reserved.</span>
                <span>Made for your everyday.</span>

            </div> */}

        </footer>
    );
}

export default Footer;