import React from "react";
import { useState } from "react";
import Menu from "../components/menu.jsx";
import Layout from "../components/layout.jsx";
const About = () => {
 
  return (
    <Layout>
     
   
        
  

      {/* About Content */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-[#FF6A00] mb-8">ABOUT US</h1>
        
        <div className="space-y-6 text-lg leading-relaxed">
          <p className="text-gray-300">
            Welcome to <span className="text-[#B8FF4D] font-bold">GLASSHOUSE</span>, 
            your trusted source for AI-powered news that actually tells you how it affects your daily life.
          </p>
          
          <p className="text-gray-300">
            We believe that news shouldn't just inform—it should empower. That's why we use cutting-edge 
            artificial intelligence to analyze and contextualize news stories, giving you the real-world 
            implications behind every headline.
          </p>

          <div className="bg-gray-900 p-6 rounded-lg border-l-4 border-[#FF6A00]">
            <h2 className="text-2xl font-bold text-[#B8FF4D] mb-4">Our Mission</h2>
            <p className="text-gray-300">
              To democratize information by making complex news stories accessible, relevant, 
              and actionable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#FF6A00] mb-3">AI-Powered Insights</h3>
              <p className="text-gray-300">
                Our advanced algorithms analyze news from multiple sources to provide you 
                with balanced perspectives and practical implications.
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#FF6A00] mb-3">Real Impact</h3>
              <p className="text-gray-300">
                Every story includes clear explanations of how it affects your finances, 
                health, career, and daily decisions.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h2 className="text-3xl font-bold text-[#B8FF4D] mb-4">Our Team</h2>
            <p className="text-gray-300">
              We're a diverse group of journalists, data scientists, and AI experts 
              passionate about making news more meaningful and accessible to everyone.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h2 className="text-3xl font-bold text-[#B8FF4D] mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              Have questions, suggestions, or want to report an issue? We'd love to hear from you.
            </p>
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="text-[#FF6A00]">Email:</span> contact@glasshouse.com
              </p>
              <p className="text-gray-300">
                <span className="text-[#FF6A00]">Twitter:</span> @glasshouse
              </p>
            </div>
          </div>
        </div>
      </div>
        
    </Layout>
  );
};

export default About;