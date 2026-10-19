import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../CartContext";
import { useWishlist } from "../WishlistContext";
import { fetchProducts } from "../api";

function Category({ category: categoryProp }) {
  // =========================
  // GET CATEGORY FROM URL
  // =========================

  const { category: routeCategory } = useParams();
  const category = categoryProp || routeCategory;

  // =========================
  // CATEGORY DATA
  // =========================

  const categoryData = {
    men: {
      title: "Men's Collection",
      description: "Discover the latest styles for modern men.",
      banner: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=88",
      subcategories: [
        "T-Shirts",
        "Shirts",
        "Jeans",
        "Trousers",
        "Jackets",
        "Hoodies",
      ],
    },

    women: {
      title: "Women's Collection",
      description: "Explore elegant and trendy styles for women.",
      banner: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=88",
      subcategories: [
        "Dresses",
        "Tops",
        "Jeans",
        "Sarees",
        "Kurtis",
        "Jackets",
      ],
    },

    kids: {
      title: "Kids' Collection",
      description: "Fun, comfortable and stylish clothes for kids.",
      banner: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=2000&q=88",
      subcategories: [
        "Boys",
        "Girls",
        "T-Shirts",
        "Dresses",
        "Jeans",
      ],
    },
  };

  // =========================
  // PRODUCTS (loaded from the backend)
  // =========================
  // Only "active" products come back, so anything the admin set to
  // Inactive is hidden here automatically.

  const [products, setProducts] = useState([]);

  useEffect(() => {
    // The URL says "men"; the database says "Men".
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    fetchProducts({ category: categoryName }).then(setProducts).catch(() => setProducts([]));
  }, [category]);

  // =========================
  // CURRENT CATEGORY
  // =========================

  const currentCategory = categoryData[category];

  // =========================
  // STATES
  // =========================

  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const [sort, setSort] = useState("default");

  // Wishlist is saved on the server (see WishlistContext.jsx)
  const { wishlistIds: wishlist, toggleWishlist } = useWishlist();
  const { cartItems, addToCart } = useCart();

  // =========================
  // CATEGORY NOT FOUND
  // =========================

  if (!currentCategory) {
    return (
      <div className="category-not-found">
        <h2>Category Not Found</h2>

        <Link to="/">
          Back to Stylehub
        </Link>
      </div>
    );
  }

  // =========================
  // FILTER PRODUCTS BY CATEGORY
  // =========================

  let categoryProducts = [...products];

  // =========================
  // FILTER BY SUBCATEGORY
  // =========================

  if (selectedSubcategory) {
    categoryProducts = categoryProducts.filter(
      (product) =>
        product.subcategory === selectedSubcategory
    );
  }

  // =========================
  // SORT PRODUCTS
  // =========================

  if (sort === "low-high") {
    categoryProducts.sort(
      (a, b) => a.price - b.price
    );
  } else if (sort === "high-low") {
    categoryProducts.sort(
      (a, b) => b.price - a.price
    );
  } else if (sort === "rating") {
    categoryProducts.sort(
      (a, b) => b.rating - a.rating
    );
  } else if (sort === "discount") {
    categoryProducts.sort(
      (a, b) => b.discount - a.discount
    );
  }

  // =========================
  // JSX
  // =========================

  return (
    <div className="category-page">
      <Header />

      {/* =========================
          CATEGORY BANNER
      ========================= */}

      <section
        className={`category-banner category-banner-${category}`}
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(20, 35, 27, 0.78), rgba(20, 35, 27, 0.16)),
            url(${currentCategory.banner})
          `,
        }}
      >
        <div className="category-banner-content">

          <p className="eyebrow">THE STYLEHUB EDIT</p>

          <h1>
            {currentCategory.title}
          </h1>

          <span className="category-banner-description">
            {currentCategory.description}
          </span>

        </div>
      </section>

      {/* =========================
          BREADCRUMB
      ========================= */}

      <div className="category-breadcrumb">

        <Link to="/">
          Home
        </Link>

        <span>/</span>

        <span>
          {currentCategory.title}
        </span>

      </div>

      {/* =========================
          SUBCATEGORY SECTION
      ========================= */}

      <section className="subcategory-section section">

        <div className="section-heading">

          <h2>Shop by edit</h2>

          <p>
            Explore our {category} collection
          </p>

        </div>

        <div className="subcategory-list">

          {/* ALL BUTTON */}

          <button
             type="button"
            className={
              selectedSubcategory === ""
                ? "subcategory-btn active"
                : "subcategory-btn"
            }
            onClick={() =>
              setSelectedSubcategory("")
            }
          >
            All
          </button>

          {/* SUBCATEGORY BUTTONS */}

          {currentCategory.subcategories.map(
            (subcategory) => (
              <button
                 type="button"
                key={subcategory}
                className={
                  selectedSubcategory === subcategory
                    ? "subcategory-btn active"
                    : "subcategory-btn"
                }
                onClick={() =>
                  setSelectedSubcategory(
                    subcategory
                  )
                }
              >
                {subcategory}
              </button>
            )
          )}

        </div>
      </section>

      {/* =========================
          PRODUCTS SECTION
      ========================= */}

      <section className="category-products section">

        {/* PRODUCTS TOP BAR */}

        <div className="category-products-top">

          <div>

            <h2>
              {selectedSubcategory ||
                currentCategory.title}
            </h2>

            <p aria-live="polite">{categoryProducts.length} {categoryProducts.length === 1 ? "piece" : "pieces"} to explore</p>

          </div>

          {/* SORT */}

          <div className="category-sort">

            <label htmlFor="category-sort">Sort by</label>

            <select
              id="category-sort"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
            >
              <option value="default">
                Recommended
              </option>

              <option value="low-high">
                Price: Low to High
              </option>

              <option value="high-low">
                Price: High to Low
              </option>

              <option value="rating">
                Highest Rated
              </option>

              <option value="discount">
                Biggest Discount
              </option>
            </select>

          </div>

        </div>

        {/* =========================
            PRODUCT GRID
        ========================= */}

        <div className="category-product-grid">

          {categoryProducts.map(
            (product) => (

              <article
                className="category-product-card"
                key={product.id}
              >

                {/* PRODUCT IMAGE */}

                <div className="category-product-image">
                  <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                    <img src={product.image} alt={product.name} />
                  </Link>

                  {/* DISCOUNT */}

                  <span className="category-discount">
                    {product.discount}% OFF
                  </span>

                  {/* WISHLIST */}

                  <button
                     type="button"
                    className={
                      wishlist.includes(product.id)
                        ? "category-wishlist active"
                        : "category-wishlist"
                    }
                    onClick={() =>
                      toggleWishlist(product.id)
                    }
                      aria-label={`${wishlist.includes(product.id) ? "Remove" : "Add"} ${product.name} ${wishlist.includes(product.id) ? "from" : "to"} wishlist`}
                      aria-pressed={wishlist.includes(product.id)}
                  >
                    {wishlist.includes(product.id)
                      ? "♥"
                      : "♡"}
                  </button>

                </div>

                {/* PRODUCT INFO */}

                <div className="category-product-info">
                  <h3><Link className="product-name-link" to={`/product/${product.id}`}>{product.name}</Link></h3>

                  {/* RATING */}

                    <div className="category-rating" aria-label={`Rated ${product.rating} out of 5`}>
                    <span aria-hidden="true">★</span> {product.rating}
                  </div>

                  {/* PRICE */}

                  <div className="category-price">

                    <strong>
                      ₹{product.price.toLocaleString("en-IN")}
                    </strong>

                    <del>
                      ₹{product.oldPrice.toLocaleString("en-IN")}
                    </del>

                  </div>

                  {/* ADD TO CART */}

                    <button
                    className={`category-cart${cartItems.some((item) => item.name === product.name) ? " is-added" : ""}`}
                    type="button"
                    aria-live="polite"
                    onClick={() => addToCart(product)}
                  >
                    {cartItems.some((item) => item.name === product.name) ? "Added to bag ✓" : "Add to bag"}
                  </button>

                </div>

              </article>
            )
          )}

        </div>

        {/* =========================
            EMPTY STATE
        ========================= */}

        {categoryProducts.length === 0 && (
          <div className="category-empty">

            <h2>
              No Products Found
            </h2>

            <p>
              Please select another category.
            </p>

          </div>
        )}

      </section>

      <Footer />
    </div>
  );
}

export default Category;