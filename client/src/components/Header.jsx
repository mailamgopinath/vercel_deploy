import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";
import { AnimatePresence, motion, EASE } from "../motion";

// Small icons drawn as SVG so they look sharp and clear at any size.
const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const SearchIcon = () => (
    <svg {...iconProps}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
const HeartIcon = () => (
    <svg {...iconProps}><path d="M12 21s-7-4.35-9.5-8.5C.9 9.6 2.2 5.5 6 5.5c2.2 0 3.6 1.1 6 3.5 2.4-2.4 3.8-3.5 6-3.5 3.8 0 5.1 4.1 3.5 7C19 16.65 12 21 12 21Z" /></svg>
);
const BagIcon = () => (
    <svg {...iconProps}><path d="M5 8h14l-1.1 12H6.1L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);

function Header() {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);     // phone menu
    const [scrolled, setScrolled] = useState(false);     // adds a shadow to the sticky header

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // How many items are in the bag (shown on the bag icon).
    const bagCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // Searching opens the shop and shows the matching products.
    function handleSearch(event) {
        event.preventDefault();
        const query = searchTerm.trim();
        if (!query) return;
        navigate(`/shop?q=${encodeURIComponent(query)}`);
    }

    return (
        <>
            <div className="announcement">Complimentary shipping on orders over ₹1,999</div>
            <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
                <div className="header-main">
                    <Link to="/" className="brand" aria-label="Stylehub home">
                        <span className="brand-mark" aria-hidden="true">S</span>
                        <span>STYLEHUB</span>
                    </Link>
                    <nav className="main-nav" aria-label="Main navigation">
                        {/* <Link to="/#new-arrivals">New in</Link> */}
                        <Link to="/women">Women</Link>
                        <Link to="/men">Men</Link>
                        <Link to="/kids">Kids</Link>
                        {/* <Link className="nav-sale" to="/#offers">Sale</Link> */}
                        {user && <Link className="nav-orders" to="/orders">My orders</Link>}
                    </nav>
                    <div className="header-actions">
                        <form className="search-form" role="search" onSubmit={handleSearch}>
                            <input
                                type="search"
                                aria-label="Search products"
                                placeholder="Search products"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                            <button type="submit" aria-label="Search"><SearchIcon /></button>
                        </form>
                        <Link className="icon-link" to="/wishlist" aria-label="Saved items"><HeartIcon /></Link>
                        <Link className="icon-link" to="/cart" aria-label={`Shopping bag, ${bagCount} items`}>
                            {/* the bag "bumps" each time the number of items changes */}
                            <motion.span
                                key={bagCount}
                                style={{ display: "grid", placeItems: "center" }}
                                initial={bagCount > 0 ? { scale: 1.3, rotate: -10 } : false}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 420, damping: 14 }}
                            >
                                <BagIcon />
                            </motion.span>
                            <AnimatePresence>
                                {bagCount > 0 && (
                                    <motion.span
                                        key="count"
                                        className="bag-count"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                    >
                                        {bagCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                        {user && <Link className="header-text-link" to="/orders">My orders</Link>}
                        {user ? (
                            <button type="button" className="auth-link" onClick={logout}>Log out ({user.name.split(" ")[0]})</button>
                        ) : (
                            <Link className="auth-link" to="/login">Log in</Link>
                        )}
                        <button
                            type="button"
                            className="menu-toggle"
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-menu"
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            <span />
                        </button>
                    </div>
                </div>

                {/* Phone menu: slides open and closed */}
                <AnimatePresence initial={false}>
                    {menuOpen && (
                        <motion.div
                            id="mobile-menu"
                            className="mobile-menu"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: EASE }}
                        >
                            <nav aria-label="Mobile navigation" onClick={() => setMenuOpen(false)}>
                                <Link to="/women">Women</Link>
                                <Link to="/men">Men</Link>
                                <Link to="/kids">Kids</Link>
                                {user && <Link to="/orders">My orders</Link>}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}

export default Header;
