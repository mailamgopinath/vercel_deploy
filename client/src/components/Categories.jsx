import React from "react";
import { Link } from "react-router-dom";

function Categories() {

    const categories = [
        {
            name: "Men",
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=82",
            link: "/men"
        },
        {
            name: "Women",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=82",
            link: "/women"
        },
        {
            name: "Kids",
            image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=82",
            link: "/kids"
        }
    ];

    return (
        <section className="categories section" id="categories">

            <div className="section-heading">
                <h2>Shop By Category</h2>
                <p>Find the perfect style for everyone</p>
            </div>

            <div className="category-grid">

                {categories.map((category) => (

                    <Link
                        to={category.link}
                        className="category-card"
                        key={category.name}
                    >

                        <img
                            src={category.image}
                            alt={category.name}
                        />

                        <div className="category-overlay">
                            <h3>{category.name}</h3>
                            <span>Shop Now →</span>
                        </div>

                    </Link>

                ))}

            </div>

        </section>
    );
}

export default Categories;