// Grey shimmering placeholders shown while the server is sending data.
// They reuse the real cards' classes, so the page does not jump when the data arrives.
//
//   <ProductCardsSkeleton variant="shop" />      cards for the grid on /shop   ("shop" | "category" | "wishlist" | "home")
//   <ProductDetailsSkeleton />                   the product page
//   <OrdersSkeleton />                           the "My orders" list
//   <ReviewsSkeleton />                          the reviews under a product
//
// The visible shapes are hidden from screen readers; they hear "Loading..." once instead.

import React from "react";

const classesFor = {
  shop: { card: "shop-product-card", image: "shop-product-image", info: "shop-product-info" },
  category: { card: "category-product-card", image: "category-product-image", info: "category-product-info" },
  wishlist: { card: "wishlist-card", image: "wishlist-image", info: "wishlist-info" },
  home: { card: "", image: "skeleton-image", info: "" },
};

const Line = ({ short, tall }) => <div className={`skeleton skeleton-line${short ? " short" : ""}${tall ? " tall" : ""}`} />;

// Just the cards: place them inside the grid that already exists on the page.
export function ProductCardsSkeleton({ variant = "shop", count = 8 }) {
  const c = classesFor[variant];
  return (
    <>
      <span className="sr-only" role="status">Loading products...</span>
      {Array.from({ length: count }, (_, n) => (
        <div className={`${c.card} skeleton-card`.trim()} key={n} aria-hidden="true">
          <div className={c.image}>
            <div className="skeleton skeleton-fill" />
          </div>
          <div className={c.info}>
            <Line />
            <Line short />
            <Line tall />
          </div>
        </div>
      ))}
    </>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <section className="product-main" aria-busy="true">
      <span className="sr-only" role="status">Loading product...</span>
      <div className="product-gallery" aria-hidden="true">
        <div className="product-thumbnails">
          {[0, 1, 2].map((n) => <div className="thumbnail skeleton" key={n} />)}
        </div>
        <div className="product-main-image skeleton" />
      </div>
      <div className="product-information" aria-hidden="true">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line big" />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" style={{ marginTop: 26 }} />
        <div className="skeleton-row">
          {[0, 1, 2, 3].map((n) => <div className="skeleton skeleton-chip" key={n} />)}
        </div>
        <div className="skeleton skeleton-line tall" style={{ marginTop: 26 }} />
        <div className="skeleton skeleton-line tall" />
      </div>
    </section>
  );
}

export function OrdersSkeleton({ count = 3 }) {
  return (
    <div className="my-orders" aria-busy="true">
      <span className="sr-only" role="status">Loading your orders...</span>
      {Array.from({ length: count }, (_, n) => (
        <div className="my-order" key={n} aria-hidden="true">
          <div className="skeleton skeleton-line" style={{ width: "40%" }} />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line tall" />
        </div>
      ))}
    </div>
  );
}

export function ReviewsSkeleton({ count = 2 }) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">Loading reviews...</span>
      {Array.from({ length: count }, (_, n) => (
        <div className="product-review" key={n} aria-hidden="true">
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  );
}
