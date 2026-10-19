import React from "react";
import { Link } from "react-router-dom";

function Offers() {
    return (
        <section className="offer-section" id="offers">

            <div className="offer-content">

                <p className="eyebrow">A little treat for your wardrobe</p>

                <h2>Good things<br />come at half.</h2>

                <p>
                    Find your new favorites in our considered selection of seasonal pieces.
                </p>

                <Link to="#new-arrivals" className="button-light">
                    Shop the edit <span className="button-arrow" aria-hidden="true">→</span>
                </Link>

            </div>

        </section>
    );
}

export default Offers;