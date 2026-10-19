import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext";
import { useWishlist } from "../WishlistContext";
import { fetchProducts } from "../api";

function ProductSection({ id, title, subtitle }) {
    const { cartItems, addToCart } = useCart();
    const { wishlistIds: savedItems, toggleWishlist } = useWishlist();

    // Show the first 4 products from the backend.
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts().then((all) => setProducts(all.slice(0, 4))).catch(() => {});
    }, []);

    return (
        <section className="products-section" id={id}>

            <div className="section-heading">

                <h2>{title}</h2>

                <p>{subtitle}</p>

            </div>

            <div className="product-grid">

                {products.map((product) => (

                    <article className="product-card" key={product.id} data-product-name={product.name}>

                        <div className="product-image">
                            <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                                <img src={product.image} alt={product.name} />
                            </Link>

                            <span className="product-tag">{product.label}</span>
                            <button
                                className="wishlist"
                                type="button"
                                aria-label={`${savedItems.includes(product.id) ? "Remove" : "Add"} ${product.name} ${savedItems.includes(product.id) ? "from" : "to"} saved items`}
                                aria-pressed={savedItems.includes(product.id)}
                                onClick={() => toggleWishlist(product.id)}
                            >
                                {savedItems.includes(product.id) ? "♥" : "♡"}
                            </button>

                        </div>

                        <div className="product-info">

                            <div className="product-meta">
                                <h3><Link className="product-name-link" to={`/product/${product.id}`}>{product.name}</Link></h3>
                                <span className="rating" aria-label="Rated 5 out of 5">★★★★★</span>
                            </div>
                            <p className="product-color">{product.color}</p>

                            <div className="price">

                                <span>₹{product.price.toLocaleString("en-IN")}</span>

                                <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>

                            </div>

                            <button
                                className={`add-cart${cartItems.some((item) => item.name === product.name) ? " is-added" : ""}`}
                                type="button"
                                aria-live="polite"
                                onClick={() => addToCart(product)}
                            >
                                {cartItems.some((item) => item.name === product.name) ? "Added to bag ✓" : "Add to bag"}
                            </button>

                        </div>

                    </article>

                ))}

            </div>

        </section>
    );
}

export default ProductSection;