import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import Layout from "../components/layout.jsx";
import { Select, Option } from "@material-tailwind/react";
import Phone from "../images/phone-man.png";
import Bill from "../images/bill.gif";

const GotATip = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "news-tip",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (submitStatus) {
      const timer = setTimeout(() => setSubmitStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      };

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_ADMIN_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_AUTOREPLY_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "news-tip", message: "" });
    } catch (error) {
      console.error("Failed to send email:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    { value: "news-tip", label: "Submit a News Tip" },
    { value: "report-news", label: "Report Incorrect News" },
    { value: "report-comment", label: "Report a Comment" },
    { value: "general", label: "General Inquiry" },
    { value: "feedback", label: "Feedback" },
  ];

  return (
    <div className="bg-black min-h-screen overflow-hidden relative">
      <Layout currentCategory="all">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-4 lg:px-0">
          <div className="flex flex-col">
            <div className="mb-12 relative">
              <h1 className="md:text-[150px] text-6xl md:-mt-20 text-[#FF6B35] leading-tight">
                GOT A
              </h1>
              <h1 className="md:text-[150px] text-6xl md:-mt-16 text-[#FF6B35] leading-tight">
                TIP?
              </h1>
            </div>

            {/* Notification */}
            {submitStatus && (
              <div
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-[500px] rounded-2xl p-4 lg:p-6 border-2 flex items-start space-x-3 lg:space-x-4 transition-transform duration-500 transform ${
                  submitStatus === "success"
                    ? "bg-gradient-to-r from-[#99FF00]/20 to-[#99FF00]/10 border-[#99FF00] translate-y-0"
                    : "bg-gradient-to-r from-[#FF6B35]/20 to-[#FF6B35]/10 border-[#FF6B35] translate-y-0"
                }`}
              >
                <div className="text-2xl lg:text-4xl">
                  {submitStatus === "success" ? "✓" : "✗"}
                </div>
                <div>
                  <p
                    className={`font-bold text-lg lg:text-xl mb-1 ${
                      submitStatus === "success" ? "text-[#99FF00]" : "text-[#FF6B35]"
                    }`}
                  >
                    {submitStatus === "success"
                      ? "Message Sent!"
                      : "Oops! Something went wrong"}
                  </p>
                  <p className="text-gray-300 text-sm lg:text-base">
                    {submitStatus === "success"
                      ? "Thanks for reaching out. We'll get back to you soon."
                      : "Please try again or email us directly at pulkeshee@gmail.com"}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 -mt-4 lg:-mt-10">
              <div className="flex flex-col lg:flex-row gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                  className="flex-1 px-4 lg:px-5 py-3 lg:py-4 caret-[#99FF00] bg-slate-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#99FF00] text-base lg:text-lg"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="flex-1 px-4 lg:px-5 py-3 lg:py-4 caret-[#99FF00] bg-slate-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#99FF00] text-base lg:text-lg"
                  required
                />
              </div>

              <div>
                <Select
                  id="subject"
                  name="subject"
                  placeholder="What is this about?"
                  value={formData.subject}
                  variant="outlined"
                  onChange={(value) =>
                    handleChange({ target: { name: "subject", value } })
                  }
                  onFocus={() => setFocusedField("subject")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-slate-500/30 border-2 border-gray-700 text-white focus:border-[#99FF00] focus:bg-slate-600/30 outline-none transition-all duration-300 appearance-none !pr-4 lg:!pr-5 pb-4 lg:pb-5 text-base lg:text-lg"
                  labelProps={{ 
                    className: "text-white peer-placeholder-shown:!left-4 lg:!left-5 !left-4 lg:!left-5 text-base lg:text-lg" 
                  }}
                  containerProps={{
                    className: "!min-w-0",
                  }}
                  menuProps={{
                    className: "bg-black border border-[#99FF00] text-white py-1 mt-1 text-base lg:text-lg",
                  }}
                  arrow={false}
                >
                  {subjectOptions.map((option) => (
                    <Option
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-[#99FF00] hover:text-black transition-colors flex items-center px-4 py-1 text-base lg:text-lg"
                    >
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Your message..."
                  className="w-full px-4 lg:px-5 py-3 lg:py-4 caret-[#FF6B35] bg-slate-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none text-base lg:text-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.message.trim()}
                  className="bg-[#FF6A00] hover:bg-[#FF8A35] text-black font-black px-6 py-3 lg:py-3 transition w-full lg:w-auto lg:mt-44 text-base lg:text-lg"
                >
                  {isSubmitting ? "SENDING..." : "SEND"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Desktop Images - Hidden on mobile */}
        <img
          src={Phone}
          alt=""
          className="hidden lg:block absolute animate-bob"
          style={{
            top: "20%",
            right: "1%",
            width: "20%",
            opacity: 1,
            rotate: "-10deg",
          }}
        />

        <img
          src={Bill}
          alt=""
          className="hidden lg:block absolute"
          style={{
            bottom: "-30%",
            right: "20%",
            width: "20%",
            opacity: 1,
          }}
        />

      </Layout>
    </div>
  );
};

export default GotATip;
