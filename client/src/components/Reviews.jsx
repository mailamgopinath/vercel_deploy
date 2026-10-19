import React from "react";

function Reviews() {

    const reviews = [
        {
            name: "Rahul",
            review: "Amazing quality and fast delivery!"
        },
        {
            name: "Priya",
            review: "The dress looks exactly like the pictures."
        },
        {
            name: "Arun",
            review: "Great collection and reasonable prices."
        }
    ];

    return (
        <section className="reviews" id="reviews">

            <div className="section-heading">

                <h2>What Our Customers Say</h2>

                <p>
                    Loved by thousands of customers
                </p>

            </div>

            <div className="review-grid">

                {reviews.map((review) => (

                    <article className="review-card" key={review.name}>
                        <div className="review-stars" aria-label="Rated 5 out of 5">★★★★★</div>
                        <p>“{review.review}”</p>
                        <div className="review-author">
                            <span className="review-avatar" aria-hidden="true">{review.name[0]}</span>
                            <span>Verified customer · {review.name}</span>
                        </div>
                    </article>

                ))}

            </div>

        </section>
    );
}

export default Reviews;