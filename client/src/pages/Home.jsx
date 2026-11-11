import React from "react";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Banners from "../components/Banners";
import Categories from "../components/Categories";
import ProductSection from "../components/ProductSection";
import Offers from "../components/Offers";
import Reviews from "../components/Reviews";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";
import { Reveal } from "../motion";

// Each section fades in and slides up the first time it scrolls into view.
function Home() {
    return (
        <>
            <Header />

            <Hero />

            <Banners />

            <Reveal as="section" className="trust-strip" aria-label="Shopping benefits" y={16}>
                <div className="trust-item"><span className="trust-icon" aria-hidden="true">↗</span>Free shipping over ₹1,999</div>
                <div className="trust-item"><span className="trust-icon" aria-hidden="true">↺</span>Easy 14-day returns</div>
                <div className="trust-item"><span className="trust-icon" aria-hidden="true">♡</span>Thoughtfully selected</div>
            </Reveal>

            <Reveal><Categories /></Reveal>

            <ProductSection
                id="new-arrivals"
                title="New Arrivals"
                subtitle="Discover our latest styles"
            />

            <ProductSection
                id="trending"
                title="Trending Products"
                subtitle="What everyone is wearing"
            />

            <ProductSection
                id="best-sellers"
                title="Best Sellers"
                subtitle="Our most popular products"
            />

            <Reveal scale={0.98}><Offers /></Reveal>

            <Reveal><Reviews /></Reveal>

            <Reveal y={16}><Newsletter /></Reveal>

            <Footer />
        </>
    );
}

export default Home;