import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../CartContext";
import api, { errorMessage, fetchProducts, normalizeProduct } from "../api";
import ProductReviews from "../components/ProductReviews";

function ProductDetails() {
  const { id } = useParams();
  return <ProductDetailsView key={id} id={id} />;
}

function ProductDetailsView({ id }) {
  const { addToCart: addProductToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setLoadError("");

      try {
        const [{ data }, allProducts] = await Promise.all([
          api.get("/products/" + encodeURIComponent(id)),
          fetchProducts(),
        ]);
        if (cancelled) return;

        let images = [];
        if (Array.isArray(data.images)) {
          images = data.images;
        } else if (typeof data.images === "string" && data.images) {
          try {
            const parsedImages = JSON.parse(data.images);
            images = Array.isArray(parsedImages) ? parsedImages : [data.images];
          } catch {
            images = [data.images];
          }
        }
        if (images.length === 0 && data.image) images = [data.image];

        const normalizedProduct = normalizeProduct(data);
        const colors = data.colors?.length ? data.colors : data.color ? [data.color] : [];
        const sizes = data.sizes?.length ? data.sizes : data.size ? [data.size] : ["One Size"];
        setProduct({
          ...normalizedProduct,
          subcategory: data.sub_category || "",
          price: Number(data.price) || 0,
          oldPrice: Number(data.old_price) || Number(data.price) || 0,
          discount: Number(data.discount) || normalizedProduct.discount,
          rating: Number(data.rating) || 0,
          images,
          image: images[0] || "",
          colors,
          sizes,
          description: data.description || "Product description is not available.",
          delivery: "Delivery across India. Estimated delivery within 3-5 business days.",
        });
        setSelectedImage(images[0] || "");
        setSelectedColor(colors[0] || "");
        setProducts(allProducts.filter((item) => item.category === data.category && item.id !== data.id));
      } catch (error) {
        if (!cancelled) setLoadError(errorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="product-details-page">
        <Header />
        <div className="product-not-found" role="status">Loading product...</div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <Header />
        <div className="product-not-found">
          <h2>{loadError === "Product not found" ? "Product Not Found" : "Could Not Load Product"}</h2>
          <p>{loadError || "The product you are looking for does not exist."}</p>
          <Link to="/shop">Back to Shop</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // =========================
  // QUANTITY FUNCTIONS
  // =========================

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function decreaseQuantity() {
    if (quantity > 1) {
      setQuantity((current) => current - 1);
    }
  }

  // =========================
  // ADD TO CART
  // =========================

  function addToCart() {
    if (!selectedSize) {
      setFeedback("Choose a size to continue.");
      return;
    }

    addProductToCart(product, quantity, { size: selectedSize, color: selectedColor });
    setFeedback(`${quantity} ${quantity === 1 ? "item" : "items"} added to your bag.`);
  }

  // =========================
  // BUY NOW
  // =========================

  function buyNow() {
    if (!selectedSize) {
      setFeedback("Choose a size to continue.");
      return;
    }

    setFeedback("Your selection is ready. Checkout will be available soon.");
  }

  function checkDelivery(event) {
    event.preventDefault();
    setDeliveryMessage(/^\d{6}$/.test(pincode)
      ? "Delivery is available. Estimated arrival: 3–5 business days."
      : "Enter a valid 6-digit pincode.");
  }

  // =========================
  // JSX
  // =========================

  return (
    <div className="product-details-page">
      <Header />

      {/* =========================
          BREADCRUMB
      ========================= */}

      <div className="product-breadcrumb">

        <Link to="/">
          Home
        </Link>

        <span>/</span>

        <Link to="/shop">
          Shop
        </Link>

        <span>/</span>

        <span>
          {product.name}
        </span>

      </div>

      {/* =========================
          PRODUCT MAIN SECTION
      ========================= */}

      <section className="product-main">

        {/* =========================
            IMAGE / GALLERY
        ========================= */}

        <div className="product-gallery">

          {/* THUMBNAILS */}

          <div className="product-thumbnails">

            {product.images.map(
              (image, index) => (
                <button
                  type="button"
                  key={index}
                  className={
                    selectedImage === image
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() =>
                    setSelectedImage(image)
                  }
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                  />
                </button>
              )
            )}

          </div>

          {/* MAIN IMAGE */}

          <div className="product-main-image">

            <img
              src={selectedImage}
              alt={product.name}
            />

            <span className="product-detail-discount">
              {product.discount}% OFF
            </span>

          </div>

        </div>

        {/* =========================
            PRODUCT INFORMATION
        ========================= */}

        <div className="product-information">

          {/* CATEGORY */}

          <p className="product-category">
            {product.category} /{" "}
            {product.subcategory}
          </p>

          {/* PRODUCT NAME */}

          <h1>
            {product.name}
          </h1>

          {/* RATING */}

          <div className="product-detail-rating">

            <span className="rating-box">
              ⭐ {product.rating}
            </span>

          </div>

          {/* PRICE */}

          <div className="product-detail-price">

            <strong>
              ₹{product.price.toLocaleString("en-IN")}
            </strong>

            <del>
              ₹{product.oldPrice.toLocaleString("en-IN")}
            </del>

            <span>
              {product.discount}% OFF
            </span>

          </div>

          <p className="tax-info">
            Inclusive of all taxes
          </p>

          <hr />

          {/* =========================
              COLOR
          ========================= */}

          <div className="product-option">

            <div className="option-heading">

              <strong>
                Color
              </strong>

              <span>
                {selectedColor}
              </span>

            </div>

            <div className="color-options">

              {product.colors.map(
                (color) => (
                  <button
                    type="button"
                    key={color}
                    className={
                      selectedColor === color
                        ? "color-btn active"
                        : "color-btn"
                    }
                    onClick={() =>
                      setSelectedColor(color)
                    }
                  >

                    <span
                      className={`color-circle ${color.toLowerCase()}`}
                    />

                    {color}

                  </button>
                )
              )}

            </div>

          </div>

          {/* =========================
              SIZE
          ========================= */}

          <div className="product-option">

            <div className="option-heading">

              <strong>
                Select Size
              </strong>

              <button
                className="size-chart-btn"
                onClick={() => setShowSizeGuide((current) => !current)}
                aria-expanded={showSizeGuide}
                type="button"
              >
                Size Chart
              </button>

            </div>

            <div className="product-size-options">

              {product.sizes.map(
                (size) => (
                  <button
                        type="button"
                        key={size}
                        className={selectedSize === size ? "product-size active" : "product-size"}
                        aria-pressed={selectedSize === size}
                        onClick={() => {
                          setSelectedSize(size);
                          setFeedback("");
                        }}
                      >
                        {size}
                      </button>
                )
              )}

            </div>

            {showSizeGuide && (
              <p className="size-guide" role="status">
                Available sizes: {product.sizes.join(" · ")}
              </p>
            )}

          </div>

          {/* =========================
              QUANTITY
          ========================= */}

          <div className="quantity-section">

            <strong>
              Quantity
            </strong>

            <div className="quantity-control">

              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={decreaseQuantity}
                disabled={quantity === 1}
              >
                −
              </button>

              <span>
                {quantity}
              </span>

              <button
                type="button"
                aria-label="Increase quantity"
                onClick={increaseQuantity}
              >
                +
              </button>

            </div>

          </div>

          {/* =========================
              CART / BUY NOW
          ========================= */}

          <div className="product-actions">
            <button
              className="add-cart-btn"
              type="button"
              onClick={addToCart}
            >
              {feedback.startsWith("Choose") ? "Add to bag" : feedback.includes("added") ? "Added to bag ✓" : "Add to bag"}
            </button>
            <button
              className="buy-now-btn"
              type="button"
              onClick={buyNow}
            >
              Buy Now
            </button>
          </div>
          <p className="purchase-feedback" role="status">{feedback}</p>

          {/* =========================
              WISHLIST
          ========================= */}

          <button
            className={wishlist ? "detail-wishlist active" : "detail-wishlist"}
            type="button"
            aria-pressed={wishlist}
            onClick={() => setWishlist((current) => !current)}
          >
            {wishlist ? "♥" : "♡"}{" "}
            {wishlist
              ? "Added to Wishlist"
              : "Add to Wishlist"}
          </button>

          {/* =========================
              DELIVERY
          ========================= */}

          <div className="delivery-box">
            <h3>Delivery Information</h3>
            <form className="delivery-input" onSubmit={checkDelivery}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                aria-label="Delivery pincode"
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                value={pincode}
                onChange={(event) => {
                  setPincode(event.target.value.replace(/\D/g, ""));
                  setDeliveryMessage("");
                }}
              />
              <button type="submit">
                Check
              </button>
            </form>
            <p className="delivery-message" role="status">{deliveryMessage}</p>
            <p>{product.delivery}</p>
          </div>

        </div>
      </section>

      {/* =========================
          PRODUCT EXTRA INFORMATION
      ========================= */}

      <section className="product-extra-info">

        {/* DESCRIPTION */}

        <div className="info-card">

          <h2>
            Product Description
          </h2>

          <p>
            {product.description}
          </p>

        </div>

        {/* DELIVERY */}

        <div className="info-card">

          <h2>
            Delivery Information
          </h2>

          <p>
            {product.delivery}
          </p>

        </div>

      </section>

      {/* =========================
          REVIEWS
      ========================= */}

      <section className="reviews-section">

        <div className="reviews-heading">

          <h2>
            Reviews & Ratings
          </h2>

          <div className="overall-rating">

            <strong>
              {product.rating}
            </strong>

            <span>
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
            </span>

            <p>
              Customer rating
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          RELATED PRODUCTS
      ========================= */}

      <section className="related-products">

        <div className="related-heading">

          <h2>
            You May Also Like
          </h2>

          <p>
            Similar products you may like
          </p>

        </div>

        <div className="related-product-grid">

          {products
            .filter(
              (item) =>
                item.category === product.category &&
                item.id !== product.id
            )
            .map(
              (item) => (
                <Link
                  to={`/product/${item.id}`}
                  className="related-card"
                  key={item.id}
                >

                  {/* RELATED IMAGE */}

                  <div className="related-image">

                    <img
                      src={item.image}
                      alt={item.name}
                    />

                  </div>

                  {/* RELATED INFO */}

                  <div className="related-info">

                    <h3>
                      {item.name}
                    </h3>

                    <span>
                      ⭐ {item.rating}
                    </span>

                    <div>

                      <strong>
                        ₹{item.price.toLocaleString("en-IN")}
                      </strong>

                      <del>
                        ₹{item.oldPrice}
                      </del>

                    </div>

                  </div>

                </Link>
              )
            )}

        </div>

      </section>

      <ProductReviews productId={product.id} />

      <Footer />
    </div>
  );
}

export default ProductDetails;