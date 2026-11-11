import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useCart } from "../CartContext";
import { useAuth } from "../AuthContext";
import { useWishlist } from "../WishlistContext";
import api, { normalizeProduct } from "../api";
import { AnimatePresence, motion, Notice, EASE, stagger } from "../motion";
import { ProductCardsSkeleton } from "../components/Skeletons";

function Wishlist() {
  const { user } = useAuth();
  const { toggleWishlist } = useWishlist();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true); // true while the saved list is loading

  // Load the logged-in user's saved products from the backend.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get("/wishlist")
      .then((response) => setWishlistItems(response.data.map(normalizeProduct)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const { cartItems, addToCart: addProductToCart } = useCart();
  const [feedback, setFeedback] = useState("");

  function removeFromWishlist(id) {
    toggleWishlist(id); // removes it on the server
    setWishlistItems((items) => items.filter((item) => item.id !== id));
  }

  function addToCart(product) {
    addProductToCart(product);
    setFeedback(`${product.name} is ready in your bag.`);
  }

  return (
    <>
      <Header />
      <main className="shopping-page wishlist-page">
        <div className="shopping-page-heading">
          <div>
            <p className="shopping-eyebrow">A LITTLE INSPIRATION</p>
            <h1>Saved for later</h1>
            <p className="shopping-intro">Keep the pieces you love close at hand.</p>
          </div>
          <Link to="/shop" className="shopping-back-link">Discover more <span aria-hidden="true">→</span></Link>
        </div>

        {!user ? (
          <section className="shopping-empty">
            <h2>Log in to see your saved items</h2>
            <Link to="/login" className="shopping-primary-link">Log in</Link>
          </section>
        ) : loading ? (
          <div className="wishlist-grid" aria-busy="true">
            <ProductCardsSkeleton variant="wishlist" count={4} />
          </div>
        ) : wishlistItems.length === 0 ? (
          <section className="shopping-empty">
            <span className="shopping-empty-mark wishlist-empty-mark" aria-hidden="true">♡</span>
            <h2>Your saved list is ready for a first favorite</h2>
            <p>Tap the heart on anything that catches your eye.</p>
            <Link to="/shop" className="shopping-primary-link">Browse the collection</Link>
          </section>
        ) : (
          <>
            <div className="wishlist-toolbar">
              <p><strong>{wishlistItems.length.toString().padStart(2, "0")}</strong> saved {wishlistItems.length === 1 ? "piece" : "pieces"}</p>
              <p>Prices shown in Indian rupees</p>
            </div>
            <div className="wishlist-grid">
              {/* cards fade in one after another, and shrink away when removed */}
              <AnimatePresence mode="popLayout" initial>
              {wishlistItems.map((product, index) => (
                <motion.article
                  className="wishlist-card"
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: stagger(index) } }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                >
                  <div className="wishlist-image">
                    <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                      <img src={product.image} alt={product.name} />
                    </Link>
                    <span className="wishlist-discount">{product.discount}% off</span>
                    <button type="button" className="wishlist-remove" aria-label={`Remove ${product.name} from saved items`} onClick={() => removeFromWishlist(product.id)}>×</button>
                  </div>
                  <div className="wishlist-info">
                    <div className="wishlist-card-heading">
                      <p className="wishlist-category">{product.category}</p>
                      <span className="wishlist-rating" aria-label={`Rated ${product.rating} out of 5`}>★ <span>{product.rating}</span></span>
                    </div>
                    <Link to={`/product/${product.id}`} className="wishlist-product-name">{product.name}</Link>
                    <div className="wishlist-price">
                      <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                      <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>
                    </div>
                    <button type="button" className={`wishlist-cart-btn${cartItems.some((item) => item.name === product.name) ? " is-added" : ""}`} onClick={() => addToCart(product)}>
                      {cartItems.some((item) => item.name === product.name) ? "Added to bag ✓" : "Add to bag"}
                    </button>
                  </div>
                </motion.article>
              ))}
              </AnimatePresence>
            </div>
            <Notice show={Boolean(feedback)} className="wishlist-feedback" role="status" aria-live="polite">{feedback}</Notice>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default Wishlist;