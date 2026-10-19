import React from "react";
import { Link } from "react-router-dom";

function Hero() {
    return (
        <section className="hero" aria-labelledby="hero-title">

            <div className="hero-content">

                <p className="eyebrow">The everyday edit · 2026</p>

                <h1 id="hero-title">Wear what<br />feels like you.</h1>

                <p className="hero-description">
                    Thoughtful pieces, easy layers, and a little something for every version of you.
                </p>

                <Link to="#new-arrivals" className="button-primary">
                    Explore the collection <span className="button-arrow" aria-hidden="true">→</span>
                </Link>

            </div>

        </section>
    );
}

export default Hero;