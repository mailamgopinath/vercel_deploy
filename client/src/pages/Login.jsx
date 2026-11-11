// One page for both "Log in" and "Create account".
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";
import { AnimatePresence, Notice, motion, EASE } from "../motion";

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false); // false = log in, true = create account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); // true while waiting for the server

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setError("");
    setSubmitting(true);

    try {
      const user = isSignUp
        ? await register(name, email, password)
        : await login(email, password);
      // Admins go to the admin panel, everyone else to the home page.
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="auth-page">
        <motion.form
          className="auth-card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {/* the title changes with a small fade when switching between log in / sign up */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={isSignUp ? "up" : "in"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {isSignUp ? "Create account" : "Welcome back"}
            </motion.h1>
          </AnimatePresence>

          {/* the name field slides open for "Create account" */}
          <AnimatePresence initial={false}>
            {isSignUp && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                style={{ overflow: "hidden", padding: "4px 0" }}
              >
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: "100%" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Notice show={Boolean(error)}>
            <p className="auth-error" role="alert">{error}</p>
          </Notice>

          <button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting && <span className="btn-spinner" aria-hidden="true" />}
            {submitting ? "Please wait..." : isSignUp ? "Sign up" : "Log in"}
          </button>

          <p className="auth-switch">
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); }}>
              {isSignUp ? "Log in" : "Create an account"}
            </button>
          </p>
          <Link to="/">← Back to home</Link>
        </motion.form>
      </main>
      <Footer />
    </>
  );
}

export default Login;
