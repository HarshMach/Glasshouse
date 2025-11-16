import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from '@emailjs/browser';
import Layout from "../components/layout";

const GotATip = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tip: '',
    urgency: 'low'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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
      // Replace these with your actual EmailJS credentials
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.tip,
        urgency: formData.urgency,
        to_email: 'pulkeshee@gmail.com'
      };

      // You need to get these from your EmailJS account
      await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
        'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
        templateParams,
        'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
      );

      setSubmitStatus('success');
      setFormData({ name: '', email: '', tip: '', urgency: 'low' });
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dummy function for layout
  const handleCategoryChange = (category) => {
    console.log('Category changed to:', category);
  };

  return (
    <Layout 
      onCategoryChange={handleCategoryChange}
      currentCategory="all"
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-6xl font-bold text-[#FF6A00] mb-2">GOT A TIP?</h1>
        <p className="text-gray-400 text-lg mb-8">
          Have breaking news or an important story? Send it our way.
        </p>

        {submitStatus === 'success' && (
          <div className="bg-green-900/30 border border-green-600 text-green-300 p-4 rounded-lg mb-6">
            <p className="font-bold">✓ Tip sent successfully!</p>
            <p>Thank you for your submission. We'll review it shortly.</p>
            <p className="text-sm mt-2">Redirecting to homepage in 3 seconds...</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="bg-red-900/30 border border-red-600 text-red-300 p-4 rounded-lg mb-6">
            <p className="font-bold">✗ Failed to send tip</p>
            <p>Please try again or contact us directly at pulkeshee@gmail.com</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">
                Your Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FF6A00] focus:outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">
                Your Email (Optional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FF6A00] focus:outline-none transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="urgency" className="block text-gray-300 mb-2 font-medium">
              Urgency Level
            </label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FF6A00] focus:outline-none transition-colors"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority - Breaking News</option>
              <option value="urgent">Urgent - Time Sensitive</option>
            </select>
          </div>

          <div>
            <label htmlFor="tip" className="block text-gray-300 mb-2 font-medium">
              Your Tip *
            </label>
            <textarea
              id="tip"
              name="tip"
              value={formData.tip}
              onChange={handleChange}
              required
              rows="8"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FF6A00] focus:outline-none transition-colors resize-vertical"
              placeholder="Provide as much detail as possible about your tip. Include sources, evidence, context, and why this is important..."
            />
          </div>

          <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-[#B8FF4D]">
            <h3 className="text-[#B8FF4D] font-bold mb-2">Before submitting:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Verify your information is accurate</li>
              <li>• Include any supporting evidence or sources</li>
              <li>• Specify if you wish to remain anonymous</li>
              <li>• Note any time sensitivity</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.tip.trim()}
            className="w-full bg-[#FF6A00] hover:bg-[#FF8A00] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            {isSubmitting ? 'SENDING TIP...' : 'SEND TIP'}
          </button>

          <p className="text-gray-500 text-sm text-center">
            All tips are confidential. We respect your privacy and will contact you only if necessary.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-bold text-[#B8FF4D] mb-3">Other Ways to Reach Us</h3>
          <div className="space-y-2 text-gray-300">
            <p>
              <span className="text-[#FF6A00] font-medium">Email:</span> pulkeshee@gmail.com
            </p>
            <p>
              <span className="text-[#FF6A00] font-medium">Encrypted:</span> Available upon request
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For highly sensitive information, we can arrange secure communication methods.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GotATip;