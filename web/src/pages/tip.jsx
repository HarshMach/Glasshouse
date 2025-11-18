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
    subject: "",
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
    <div className="bg-black min-h-screen ">
      <Layout currentCategory="all">
        <div className="grid grid-cols-2 gap-12">
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
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[500px] rounded-2xl p-6 border-2 flex items-start space-x-4 transition-transform duration-500 transform ${
                  submitStatus === "success"
                    ? "bg-gradient-to-r from-[#99FF00]/20 to-[#99FF00]/10 border-[#99FF00] translate-y-0"
                    : "bg-gradient-to-r from-[#FF6B35]/20 to-[#FF6B35]/10 border-[#FF6B35] translate-y-0"
                }`}
              >
                <div className="text-4xl">
                  {submitStatus === "success" ? "✓" : "✗"}
                </div>
                <div>
                  <p
                    className={`font-bold text-xl mb-1 ${
                      submitStatus === "success"
                        ? "text-[#99FF00]"
                        : "text-[#FF6B35]"
                    }`}
                  >
                    {submitStatus === "success"
                      ? "Message Sent!"
                      : "Oops! Something went wrong"}
                  </p>
                  <p className="text-gray-300">
                    {submitStatus === "success"
                      ? "Thanks for reaching out. We'll get back to you soon."
                      : "Please try again or email us directly at pulkeshee@gmail.com"}
                  </p>
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
                  className="flex-1 px-5 py-4 caret-[#99FF00] bg-slate-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#99FF00]"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="flex-1 px-5 py-4 caret-[#99FF00] bg-slate-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#99FF00]"
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
                  className="w-full max-w-[730px] bg-slate-500/30 border-2 border-gray-700 text-white focus:border-[#99FF00] focus:bg-slate-600/30 outline-none transition-all duration-300 appearance-none !pr-5 pb-5"
                  labelProps={{
                    className:
                      "text-white peer-placeholder-shown:!left-5 !left-5",
                  }}
                  containerProps={{
                    className: "!min-w-0",
                  }}
                  menuProps={{
                    className:
                      "bg-black border border-[#99FF00] text-white py-1 mt-1",
                  }}
                  arrow={false}
                >
                  {subjectOptions.map((option) => (
                    <Option
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-[#99FF00] hover:text-black transition-colors flex items-center px-4 py-1"
                    >
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex gap-4 items-start max-w-[730px]">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Your message..."
                  className="flex-1 px-5 py-4 caret-[#FF6B35] bg-slate-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.message.trim()}
                  className="bg-[#FF6A00] hover:bg-[#FF8A35] text-black font-black px-6 py-3  transition mt-44"
                >
                  {isSubmitting ? "SENDING..." : "SEND"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <img
          src={Phone}
          alt=""
          className="absolute animate-bob"
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
          className="absolute"
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
