import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../CartContext";
import { useWishlist } from "../WishlistContext";
import { fetchProducts } from "../api";

function Shop() {

  // Products come from the backend (loaded once when the page opens).
  // Text typed in the header search box (the address looks like /shop?q=shirt)
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();

  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setLoadError("Could not load products. Is the server running?"));
  }, []);

  // =========================
  // FILTER STATES
  // =========================

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState("");
  const [maxPrice, setMaxPrice] = useState(2000);

  // =========================
  // SORT & WISHLIST STATES
  // =========================

  const [sort, setSort] = useState("newest");
  // Wishlist is saved on the server (see WishlistContext.jsx)
  const { wishlistIds: wishlist, toggleWishlist } = useWishlist();
  const { cartItems, addToCart } = useCart();
  const [showFilters, setShowFilters] = useState(false);


  // =========================
  // CLEAR FILTERS
  // =========================

  function clearFilters() {
    setSelectedCategory("");
    setSelectedSize("");
    setSelectedColor("");
    setSelectedBrand("");
    setSelectedRating("");
    setSelectedDiscount("");
    setMaxPrice(2000);
  }

  // =========================
  // FILTER PRODUCTS
  // =========================

  let filteredProducts = products.filter((product) => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery)) {
      return false;
    }

    if (
      selectedCategory &&
      product.category !== selectedCategory
    ) {
      return false;
    }

    if (
      selectedSize &&
      product.size !== selectedSize
    ) {
      return false;
    }

    if (
      selectedColor &&
      product.color !== selectedColor
    ) {
      return false;
    }

    if (
      selectedBrand &&
      product.brand !== selectedBrand
    ) {
      return false;
    }

    if (
      selectedRating &&
      product.rating < Number(selectedRating)
    ) {
      return false;
    }

    if (
      selectedDiscount &&
      product.discount < Number(selectedDiscount)
    ) {
      return false;
    }

    if (product.price > Number(maxPrice)) {
      return false;
    }

    return true;
  });

  // =========================
  // SORT PRODUCTS
  // =========================

  if (sort === "low-high") {
    filteredProducts.sort(
      (a, b) => a.price - b.price
    );
  } else if (sort === "high-low") {
    filteredProducts.sort(
      (a, b) => b.price - a.price
    );
  } else if (sort === "rating") {
    filteredProducts.sort(
      (a, b) => b.rating - a.rating
    );
  } else if (sort === "popularity") {
    filteredProducts.sort(
      (a, b) => b.popularity - a.popularity
    );
  } else if (sort === "newest") {
    filteredProducts.sort(
      (a, b) => b.newest - a.newest
    );
  }

  // =========================
  // JSX
  // =========================

  return (
    <div className="shop-page">
      <Header />

      {/* =========================
          SHOP HEADER
      ========================= */}

      <div className="shop-header">
        <div className="shop-heading-copy">
          <p className="shop-eyebrow">The Stylehub edit</p>
          <h1>Find your new favorite.</h1>
          <p>{searchQuery ? `Showing results for “${searchParams.get("q")}”` : "Everyday pieces, thoughtfully selected for your wardrobe."}</p>
        </div>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Shop</span>
        </nav>
      </div>

      {/* =========================
          SHOP CONTENT
      ========================= */}

      <div className="shop-container">

        {/* =========================
            FILTER SIDEBAR
        ========================= */}

        <aside className={`filter-sidebar${showFilters ? " is-open" : ""}`} aria-label="Product filters">

          <div className="filter-title">
            <h2>Filters</h2>

            <button type="button" onClick={clearFilters}>
              Clear All
            </button>
          </div>

          {/* CATEGORY */}

          <div className="filter-group">
            <h3>Category</h3>

            <label>
              <input
                type="radio"
                name="category"
                value="Men"
                checked={selectedCategory === "Men"}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
              />

              Men
            </label>

            <label>
              <input
                type="radio"
                name="category"
                value="Women"
                checked={selectedCategory === "Women"}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
              />

              Women
            </label>

            <label>
              <input
                type="radio"
                name="category"
                value="Kids"
                checked={selectedCategory === "Kids"}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
              />

              Kids
            </label>
          </div>

          {/* SIZE */}

          <div className="filter-group">
            <h3>Size</h3>

            <div className="size-options">
              {["S", "M", "L", "XL"].map((size) => (
                <button
                  key={size}
                  className={
                    selectedSize === size
                      ? "active-size"
                      : ""
                  }
                  onClick={() =>
                    setSelectedSize(
                      selectedSize === size
                        ? ""
                        : size
                    )
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* COLOR */}

          <div className="filter-group">
            <h3>Color</h3>

            <select
              value={selectedColor}
              onChange={(e) =>
                setSelectedColor(e.target.value)
              }
            >
              <option value="">
                All Colors
              </option>

              <option value="Black">
                Black
              </option>

              <option value="White">
                White
              </option>

              <option value="Blue">
                Blue
              </option>

              <option value="Red">
                Red
              </option>

              <option value="Pink">
                Pink
              </option>

              <option value="Yellow">
                Yellow
              </option>

              <option value="Grey">
                Grey
              </option>
            </select>
          </div>

          {/* BRAND */}

          <div className="filter-group">
            <h3>Brand</h3>

            <select
              value={selectedBrand}
              onChange={(e) =>
                setSelectedBrand(e.target.value)
              }
            >
              <option value="">
                All Brands
              </option>

              <option value="Urban Style">
                Urban Style
              </option>

              <option value="Denim Co">
                Denim Co
              </option>

              <option value="Fashion Hub">
                Fashion Hub
              </option>

              <option value="Style House">
                Style House
              </option>

              <option value="Kids World">
                Kids World
              </option>
            </select>
          </div>

          {/* PRICE */}

          <div className="filter-group">
            <h3>Price</h3>

            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value)
              }
            />

            <div className="price-range">
              <span>₹300</span>

              <span>
                ₹{maxPrice}
              </span>
            </div>
          </div>

          {/* RATING */}

          <div className="filter-group">
            <h3>Rating</h3>

            <label>
              <input
                type="radio"
                name="rating"
                value="4"
                checked={selectedRating === "4"}
                onChange={(e) =>
                  setSelectedRating(e.target.value)
                }
              />

              ⭐ 4★ & above
            </label>

            <label>
              <input
                type="radio"
                name="rating"
                value="3"
                checked={selectedRating === "3"}
                onChange={(e) =>
                  setSelectedRating(e.target.value)
                }
              />

              ⭐ 3★ & above
            </label>
          </div>

          {/* DISCOUNT */}

          <div className="filter-group">
            <h3>Discount</h3>

            <label>
              <input
                type="radio"
                name="discount"
                value="20"
                checked={selectedDiscount === "20"}
                onChange={(e) =>
                  setSelectedDiscount(e.target.value)
                }
              />

              20% & above
            </label>

            <label>
              <input
                type="radio"
                name="discount"
                value="30"
                checked={selectedDiscount === "30"}
                onChange={(e) =>
                  setSelectedDiscount(e.target.value)
                }
              />

              30% & above
            </label>
          </div>
        </aside>

        {/* =========================
            PRODUCTS AREA
        ========================= */}

        <main className="products-area">

          {/* TOP BAR */}

          <div className="shop-topbar">
            <button
              className="mobile-filter-toggle"
              type="button"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((current) => !current)}
            >
              <span aria-hidden="true">☷</span> Filters
            </button>
            <p className="result-count" aria-live="polite">
              <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "item" : "items"}
            </p>

            <div className="sort-box">

              <label htmlFor="shop-sort">Sort by</label>

              <select
                id="shop-sort"
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
              >
                <option value="newest">
                  Newest
                </option>

                <option value="low-high">
                  Price: Low to High
                </option>

                <option value="high-low">
                  Price: High to Low
                </option>

                <option value="popularity">
                  Popularity
                </option>

                <option value="rating">
                  Rating
                </option>
              </select>

            </div>
          </div>

          {/* =========================
              PRODUCT GRID
          ========================= */}

          {filteredProducts.length > 0 ? (

            <div className="shop-product-grid">

              {filteredProducts.map((product) => (

                <div
                  className="shop-product-card"
                  key={product.id}
                >

                  {/* PRODUCT IMAGE */}

                  <div className="shop-product-image">
                    <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                      <img src={product.image} alt={product.name} />
                    </Link>

                    {/* DISCOUNT */}

                    <span className="discount-badge">
                      {product.discount}% OFF
                    </span>

                    {/* WISHLIST */}

                    <button
                      type="button"
                      className={
                        wishlist.includes(product.id)
                          ? "wishlist-btn wishlist-active"
                          : "wishlist-btn"
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

                  <div className="shop-product-info">

                    <p className="product-brand">
                      {product.brand}
                    </p>

                    <h3><Link className="product-name-link" to={`/product/${product.id}`}>{product.name}</Link></h3>

                    {/* RATING */}

                    <div className="product-rating" aria-label={`Rated ${product.rating} out of 5`}>
                      <span aria-hidden="true">★</span>
                      {product.rating}
                    </div>

                    {/* PRICE */}

                    <div className="shop-price">

                      <strong>
                        ₹{product.price.toLocaleString("en-IN")}
                      </strong>

                      <del>
                        ₹{product.oldPrice.toLocaleString("en-IN")}
                      </del>

                      <span>
                        ({product.discount}% off)
                      </span>

                    </div>

                    {/* ADD TO CART */}

                    <button
                      className={`shop-add-cart${cartItems.some((item) => item.name === product.name) ? " is-added" : ""}`}
                      type="button"
                      aria-live="polite"
                      onClick={() => addToCart(product)}
                    >
                      {cartItems.some((item) => item.name === product.name) ? "Added to bag ✓" : "Add to bag"}
                    </button>

                  </div>
                </div>
              ))}

            </div>

          ) : (

            /* =========================
                NO PRODUCTS
            ========================= */

            <div className="no-products">

              <h2>
                No Products Found
              </h2>

              <p>
                {loadError || "Try changing your filters."}
              </p>

              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>

            </div>
          )}

        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Shop;