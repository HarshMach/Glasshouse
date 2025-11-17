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
      
      setTimeout(() => {
        // Would redirect to homepage in actual implementation
        console.log('Redirecting to homepage...');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    { value: 'news-tip', label: '📰 Submit a News Tip', icon: '📰' },
    { value: 'report-news', label: '⚠️ Report Incorrect News', icon: '⚠️' },
    { value: 'report-comment', label: '🚨 Report a Comment', icon: '🚨' },
    { value: 'general', label: '💬 General Inquiry', icon: '💬' },
    { value: 'partnership', label: '🤝 Partnership Opportunity', icon: '🤝' },
    { value: 'feedback', label: '⭐ Feedback', icon: '⭐' }
  ];

  const handleCategoryChange = () => {};

  return (
    <Layout 
      onCategoryChange={handleCategoryChange}
          currentCategory="all"
          bgColor="bg-gradient-to-r from-[#99FF00] to-[#FF6B35]/50 via-[#FF8A35]"
    >
      <div className="max-w-4xl mx-auto">
        {/* Animated Header */}
        <div className="mb-12 relative">
          <h1 className="text-7xl md:text-8xl font-medium text-black bg-clip-text  mb-4">
            Got a Tip?
          </h1>
          <div className="h-2 w-32  rounded-full"></div>
          <p className="text-black text-xl mt-6 animate-fade-in">
            Have a story? Found a bug? Just want to say hi? We're all ears.
          </p>
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
        <div className="space-y-6">
          {/* Name & Email Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="relative group">
              <label 
                htmlFor="name" 
                className={`block text-sm font-bold mb-2 transition-colors ${
                  focusedField === 'name' ? 'text-black' : 'text-black'
                }`}
              >
                YOUR NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full bg-gray-900/50 px-5 py-4 text-white placeholder-gray-500 focus:border-2 focus:border-[#99FF00] focus:bg-gray-900 outline-none transition-all duration-300 hover:border-gray-600"
                  placeholder="Jane Doe"
                />
                <div className={`absolute inset-0 rounded-xl bg-[#99FF00]/5 -z-10 blur-xl transition-opacity ${
                  focusedField === 'name' ? 'opacity-100' : 'opacity-0'
                }`}></div>
              </div>
            </div>

            {/* Email Field */}
            <div className="relative group">
              <label 
                htmlFor="email" 
                className={`block text-sm font-bold mb-2 transition-colors ${
                  focusedField === 'email' ? 'text-black' : 'text-black'
                }`}
              >
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full bg-gray-900/50 px-5 py-4 text-white placeholder-gray-500 focus:border-2 focus:border-[#35ff4d] focus:bg-gray-900 outline-none transition-all duration-300 hover:border-gray-600"
                  placeholder="jane@example.com"
                />
                <div className={`absolute inset-0 rounded-xl bg-[#FF6B35]/5 -z-10 blur-xl transition-opacity ${
                  focusedField === 'email' ? 'opacity-100' : 'opacity-0'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Subject Dropdown */}
          <div className="relative group">
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
                className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-xl px-5 py-4 text-white focus:border-[#99FF00] focus:bg-gray-900 outline-none transition-all duration-300 hover:border-gray-600 appearance-none cursor-pointer"
              >
                {subjectOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className={`absolute inset-0 rounded-xl bg-[#99FF00]/5 -z-10 blur-xl transition-opacity ${
                focusedField === 'subject' ? 'opacity-100' : 'opacity-0'
              }`}></div>
            </div>
          </div>

          {/* Message Field */}
          <div className="relative group">
            <label 
              htmlFor="message" 
              className={`block text-sm font-bold mb-2 transition-colors ${
                focusedField === 'message' ? 'text-[#FF6B35]' : 'text-gray-400'
              }`}
            >
              YOUR MESSAGE
            </label>
            <div className="relative">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onFocus={() => setFocusedField('message')}
                onBlur={() => setFocusedField(null)}
                required
                rows="8"
                className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:border-[#FF6B35] focus:bg-gray-900 outline-none transition-all duration-300 hover:border-gray-600 resize-none"
                placeholder="Tell us everything. The more details, the better..."
              />
              <div className={`absolute inset-0 rounded-xl bg-[#FF6B35]/5 -z-10 blur-xl transition-opacity ${
                focusedField === 'message' ? 'opacity-100' : 'opacity-0'
              }`}></div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border-l-4 border-[#99FF00] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#99FF00]/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <h3 className="text-[#99FF00] font-black text-lg mb-3 flex items-center">
                <span className="mr-2">💡</span>
                QUICK TIPS
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-[#FF6B35] mr-2">▸</span>
                  <span>Be as specific as possible</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF6B35] mr-2">▸</span>
                  <span>Include links or evidence if reporting news</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF6B35] mr-2">▸</span>
                  <span>We typically respond within 24-48 hours</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.message.trim()}
            className="group relative w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8A35] hover:from-[#FF8A35] hover:to-[#FF6B35] disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-black py-5 px-8 rounded-xl transition-all duration-300 text-lg overflow-hidden shadow-lg hover:shadow-[#FF6B35]/50 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SENDING...
                </>
              ) : (
                <>
                  SEND MESSAGE
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>

          <p className="text-gray-500 text-sm text-center">
            🔒 Your information is confidential and secure
          </p>
        </div>

      
      </div>

          <style>{`
      .bg-gradient-background {
  background: 
    radial-gradient(circle at top left, #ffff00 0%, transparent 50%),
    radial-gradient(circle at bottom right, #ff8c00 0%, transparent 60%),
    radial-gradient(circle at center, #ff5e7a 0%, transparent 70%);
  background-size: 200% 200%;
  animation: gradientMove 10s ease infinite;
  position: absolute;
  width: 100%;
  height: 100%;
}

@keyframes gradientMove {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default GotATip;