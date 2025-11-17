import React, { useState, useRef, useEffect } from 'react';

const VoyageStartup = ({ onComplete, brandName = "VOYAGE" }) => {
  const textWrapperRef = useRef(null);
  const headerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Start animation automatically
    const textLines = textWrapperRef.current?.querySelectorAll('.text-line');
    
    // Phase 1: Move text lines right
    setTimeout(() => {
      textLines?.forEach((line, i) => {
        line.style.transition = `transform 1s ease-in-out ${i * 0.1}s`;
        line.style.transform = 'translateX(500px)';
      });
    }, 100);

    // Phase 2: Transform text wrapper
    setTimeout(() => {
      if (textWrapperRef.current) {
        textWrapperRef.current.style.transition = 'all 3s ease-in-out';
        textWrapperRef.current.style.transform = 'translateY(-600px) scale(4.5) rotate(-90deg)';
      }
    }, 1500);

    // Phase 3: Increase opacity and move left
    setTimeout(() => {
      textLines?.forEach((line, i) => {
        line.style.opacity = '1';
        line.style.transition = `transform 4s ease-in-out ${i * 0.05}s, opacity 1s ease-in-out`;
        line.style.transform = 'translateX(-3500px)';
      });
    }, 3500);

    // Phase 4: Hide orange background
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.bottom = '-100%';
      }
    }, 6000);

    // Phase 5: Reveal header with letter animation
    setTimeout(() => {
      if (headerRef.current) {
        const letters = headerRef.current.querySelectorAll('.letter');
        letters.forEach((letter, i) => {
          setTimeout(() => {
            letter.style.opacity = '1';
            letter.style.transform = 'translateY(0)';
          }, i * 40);
        });
      }
    }, 7000);

    // Complete animation
    setTimeout(() => {
      onComplete?.();
    }, 9000);
  }, [onComplete]);

  const texts = [
    "Zealously few furniture repulsive agreeable consisted.",
    "Collected breakfast estimable questions in to it.",
    "For him precaution any advantages dissimilar few.",
    "Shortly respect ask cousins brought add tedious nay.",
    "Object remark lively all did feebly excuse our wooded.",
    "Sufficient unpleasing an insensible motionless if ye.",
    "The for fully had she there leave merit enjoy forth.",
    "In in written on charmed justice is amiable farther.",
    "How daughters not promotion few knowledge contented.",
    "Zealously few furniture repulsive.",
    "Collected breakfast estimable questions in to it.",
    "For him precaution any advantages dissimilar few.",
    "Shortly respect ask cousins brought add tedious nay.",
    "Object remark lively all did feebly excuse wooded.",
    "Sufficient unpleasing an insensible motionless ye.",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background Header - Always visible */}
      <div className="fixed inset-0 bg-[#0f0f0f] text-white flex justify-center items-center z-10">
        <div 
          ref={headerRef}
          className="text-8xl font-black tracking-wider"
          style={{ fontFamily: 'Helvetica, sans-serif' }}
        >
          {brandName.split('').map((char, i) => (
            <span
              key={i}
              className="letter inline-block opacity-0"
              style={{
                transform: 'translateY(200px)',
                transition: 'all 2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>

      {/* Orange Container */}
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-[#de5e40] z-20 transition-all duration-[2000ms] ease-in-out"
        style={{ bottom: '0' }}
      />

      {/* Text Wrapper */}
      <div
        ref={textWrapperRef}
        className="fixed w-full h-screen flex flex-col justify-between cursor-default z-30"
        style={{
          left: '-50%',
        }}
      >
        {texts.map((text, i) => (
          <div
            key={i}
            className="text-line w-[300%] uppercase opacity-10 text-[5vw]"
            style={{
              fontFamily: 'Helvetica, sans-serif',
              fontWeight: 'bold',
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoyageStartup;