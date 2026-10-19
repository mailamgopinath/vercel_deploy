// Loads Razorpay's payment window (their script) the first time it is needed.
// After this resolves, `new window.Razorpay({...}).open()` shows the payment popup.

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load the payment window. Please check your internet connection."));
    document.body.appendChild(script);
  });
}
