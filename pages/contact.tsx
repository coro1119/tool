import Head from "next/head";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return alert("All fields required.");
    setLoading(true);
    try {
      const res = await fetch("https://formspree.io/f/xvgzlowq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert("Sent!");
        setForm({ name: "", email: "", message: "" });
      } else throw new Error();
    } catch (err) {
      alert("Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact — FinanceCalculator</title>
        <link rel="canonical" href="https://financecalculator.cloud/contact" />
      </Head>
      <div className="contact-page-wrapper">
        <div className="contact-header-box">
          <span className="minimal-tag">CONNECT</span>
          <h2>Work with Me</h2>
          <p>협업 문의나 피드백을 남겨주세요.</p>
        </div>
        <form className="premium-contact-card" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Your Name</label>
            <input 
                type="text" 
                placeholder="Name" 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label>Your Email</label>
            <input 
                type="email" 
                placeholder="example@email.com" 
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label>Message</label>
            <textarea 
                placeholder="Message"
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
            ></textarea>
          </div>
          <button type="submit" className="fancy-submit-btn" disabled={loading}>
            <span>{loading ? "Sending..." : "Send Message"}</span>
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </>
  );
}
