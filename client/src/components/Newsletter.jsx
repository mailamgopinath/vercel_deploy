import React, { useState } from "react";

function Newsletter() {

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit(e) {

        e.preventDefault();

        setMessage("Thanks for joining us. Look out for a welcome note soon.");
        setEmail("");
    }

    return (
        <section className="newsletter">

            <h2>
                Stay In Style
            </h2>

            <p>
                Subscribe to get updates about new
                collections and exclusive offers.
            </p>

            <form onSubmit={handleSubmit}>

                <input
                    type="email"
                    placeholder="Your email address"
                    aria-label="Email address"
                    required
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

                <button type="submit">
                    Subscribe
                </button>

            </form>
            <p className="newsletter-message" role="status">{message}</p>
        </section>
    );
}

export default Newsletter;