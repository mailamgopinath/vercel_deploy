import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE } from "../motion";

// Each piece of the hero appears one after another (eyebrow, heading, text, button).
const container = { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
// The two heading lines slide up out of a mask (the .hero-line box hides them until they move).
const line = { hidden: { y: "105%" }, show: { y: 0, transition: { duration: 0.85, ease: EASE } } };

function Hero() {
    // Parallax: while scrolling past the hero, the photo drifts slower than the page.
    const { scrollY } = useScroll();
    const photoPosition = useTransform(scrollY, [0, 700], ["39%", "62%"]);
    const textShift = useTransform(scrollY, [0, 500], [0, 60]);

    return (
        <motion.section className="hero" aria-labelledby="hero-title" style={{ backgroundPositionY: photoPosition }}>

            <motion.div className="hero-content" variants={container} initial="hidden" animate="show" style={{ y: textShift }}>

                <motion.p className="eyebrow" variants={item}>The everyday edit · 2026</motion.p>

                <h1 id="hero-title">
                    <span className="hero-line"><motion.span variants={line} style={{ display: "block" }}>Wear what</motion.span></span>
                    <span className="hero-line"><motion.span variants={line} style={{ display: "block" }}>feels like you.</motion.span></span>
                </h1>

                <motion.p className="hero-description" variants={item}>
                    Thoughtful pieces, easy layers, and a little something for every version of you.
                </motion.p>

                <motion.div variants={item}>
                    <Link to="#new-arrivals" className="button-primary">
                        Explore the collection <span className="button-arrow" aria-hidden="true">→</span>
                    </Link>
                </motion.div>

            </motion.div>

        </motion.section>
    );
}

export default Hero;
