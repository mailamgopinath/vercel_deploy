// One page for both "Log in" and "Create account".
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false); // false = log in, true = create account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setError("");

    try {
      const user = isSignUp
        ? await register(name, email, password)
        : await login(email, password);
      // Admins go to the admin panel, everyone else to the home page.
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <Header />
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>{isSignUp ? "Create account" : "Welcome back"}</h1>

          {isSignUp && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
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

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit">{isSignUp ? "Sign up" : "Log in"}</button>

          <p className="auth-switch">
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); }}>
              {isSignUp ? "Log in" : "Create an account"}
            </button>
          </p>
          <Link to="/">← Back to home</Link>
        </form>
      </main>
      <Footer />
    </>
  );
}

export default Login;
