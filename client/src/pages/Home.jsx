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

function Home() {
    return (
        <>
            <Header />

            <Hero />

            <Banners />

            <section className="trust-strip" aria-label="Shopping benefits">
                <div className="trust-item"><span className="trust-icon" aria-hidden="true">↗</span>Free shipping over ₹1,999</div>
                <div className="trust-item"><span className="trust-icon" aria-hidden="true">↺</span>Easy 14-day returns</div>
                <div className="trust-item"><span className="trust-icon" aria-hidden="true">♡</span>Thoughtfully selected</div>
            </section>

            <Categories />

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

            <Offers />

            <Reviews />

            <Newsletter />

            <Footer />
        </>
    );
}

export default Home;