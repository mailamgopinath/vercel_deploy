// Customer reviews for one product, plus a form to write one.
// Usage: <ProductReviews productId={product.id} />
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api, { errorMessage, fetchProducts } from "../api";

function ProductReviews({ productId: productIdProp, productName }) {
  const { user } = useAuth();
  const [resolvedProductId, setResolvedProductId] = useState(null);
  const productId = productIdProp || resolvedProductId;
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  function loadReviews(id) {
    api.get("/reviews", { params: { productId: id } }).then((response) => setReviews(response.data));
  }

  useEffect(() => {
    if (productIdProp) {
      loadReviews(productIdProp);
      return;
    }

    if (!productName) return;

    fetchProducts().then((products) => {
      const match = products.find((p) => p.name.toLowerCase() === productName.toLowerCase());
      if (match) {
        setResolvedProductId(match.id);
        loadReviews(match.id);
      }
    }).catch(() => {});
  }, [productIdProp, productName]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/reviews", { productId, rating, comment });
      setComment("");
      setMessage("Thanks for your review!");
      loadReviews(productId);
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  if (!productId) return null;

  return (
    <section className="product-reviews">
      <h2>Customer reviews</h2>

      {reviews.length === 0 && <p>No reviews yet. Be the first!</p>}
      {reviews.map((review) => (
        <div className="product-review" key={review.id}>
          <strong>{review.user_name}</strong>
          <span aria-label={`${review.rating} out of 5`}> {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
          {review.comment && <p>{review.comment}</p>}
        </div>
      ))}

      {user ? (
        <form className="product-review-form" onSubmit={submit}>
          <h3>Write a review</h3>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {"★".repeat(n)}</option>)}
          </select>
          <textarea rows={3} placeholder="Share your thoughts (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="submit">Submit review</button>
          {message && <p role="status">{message}</p>}
        </form>
      ) : (
        <p><Link to="/login">Log in</Link> to write a review.</p>
      )}
    </section>
  );
}

export default ProductReviews;
