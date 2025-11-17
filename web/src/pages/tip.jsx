import React, { useState } from "react";
import emailjs from '@emailjs/browser';
import Layout from "../components/layout.jsx";

const GotATip = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'news-tip',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'pulkeshee@gmail.com'
      };

      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        templateParams,
        'YOUR_PUBLIC_KEY'
      );

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: 'news-tip', message: '' });

      setTimeout(() => console.log('Redirecting to homepage...'), 3000);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    { value: 'news-tip', label: 'Submit a News Tip' },
    { value: 'report-news', label: 'Report Incorrect News' },
    { value: 'report-comment', label: 'Report a Comment' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'feedback', label: 'Feedback' }
  ];

  const handleCategoryChange = () => {};

  return (
    <div className="bg-black min-h-screen">
      <Layout onCategoryChange={handleCategoryChange} currentCategory="all">
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-12">
          {/* Left column: everything you already have */}
          <div className="flex flex-col">
            <div className="mb-12 relative">
              <h1 className="text-[150px] -mt-20 text-[#99FF00] leading-tight">GOT A</h1>
              <h1 className="text-[150px] -mt-16 text-[#99FF00] leading-tight">TIP?</h1>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="bg-gradient-to-r from-[#99FF00]/20 to-[#99FF00]/10 border-2 border-[#99FF00] rounded-2xl p-6 mb-8 animate-slide-in">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl animate-bounce">✓</div>
                  <div>
                    <p className="font-bold text-[#99FF00] text-xl mb-1">Message Sent!</p>
                    <p className="text-gray-300">Thanks for reaching out. We'll get back to you soon.</p>
                    <p className="text-sm text-gray-500 mt-2">Redirecting in 3 seconds...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="bg-gradient-to-r from-[#FF6B35]/20 to-[#FF6B35]/10 border-2 border-[#FF6B35] rounded-2xl p-6 mb-8 animate-slide-in">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">✗</div>
                  <div>
                    <p className="font-bold text-[#FF6B35] text-xl mb-1">Oops! Something went wrong</p>
                    <p className="text-gray-300">Please try again or email us directly at pulkeshee@gmail.com</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 -mt-10">
              <div className="flex gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                  className="w-80 px-5 py-4 bg-slate-600/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#99FF00]"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-96 px-5 py-4 bg-slate-600/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#99FF00] "
                  required
                />
              </div>

              <div className="w-96 relative">
  <label
    htmlFor="subject"
    className={`block text-sm font-bold mb-2 transition-colors ${
      focusedField === 'subject' ? 'text-[#99FF00]' : 'text-gray-400'
    }`}
  >
    WHAT'S THIS ABOUT?
  </label>
  <div className="relative">
    <select
      id="subject"
      name="subject"
      value={formData.subject}
      onChange={handleChange}
      onFocus={() => setFocusedField('subject')}
      onBlur={() => setFocusedField(null)}
      className="w-[730px] bg-slate-600/30 border-2 border-gray-700 px-5 py-4 text-white focus:border-[#99FF00] focus:bg-gray-900 outline-none transition-all duration-300 hover:border-gray-600 appearance-none cursor-pointer"
      style={{ accentColor: '#99FF00' }}
    >
      {subjectOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {/* Arrow icon */}
    <div className="absolute -right-80 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <svg className="w-5 h-5 text-[#99FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
  </div>
</div>


              <div className="flex gap-6 items-start">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Your message..."
                  className="w-[730px] h-40 px-5 py-4  bg-slate-600/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none"
                  required
                />

              
                          </div>
                            <button
                  type="submit"
                  disabled={isSubmitting || !formData.message.trim()}
                  className="mt-40 bg-[#FF6A00] hover:bg-[#FF8A35] text-black font-black  px-8 py-3  transition"
                >
                  {isSubmitting ? "SENDING..." : "SEND"}
                </button>
            </form>
          </div>

          {/* Right column: empty for now */}
          <div className="flex flex-col">
            {/* Add content here later */}
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default GotATip;
