
import {React, useState } from "react";
import Layout from "../components/layout.jsx";
import Fists from "../images/Fists.png";

const About = () => {

  const [bobbingConfig] = useState(() => ({
    Fists: {
      duration: `${3 + Math.random() * 3}s`, // 3–6s
      delay: `${Math.random() * 2}s`, // 0–2s
    },
  }));

  return (
    <div className="bg-black">
      <Layout>
        {/* About Content */}
        <div className="max-w-5xl mx-auto relative">
          <h1 className="text-8xl bg-[#FF6A00] font-medium text-center text-black mt-10 mb-20">
            Because Power Belongs <br></br>To The Informed
          </h1>

          <div className="absolute inset-0 pointer-events-none ">
            <img
              src={Fists}
              alt=""
              className="absolute animate-bob"
              style={{
                top: "20%",
                left: "-4%",
                width: "18%",

                opacity: 1,
                rotate: "-10deg",
              }}
            />
            <img
              src={Fists}
              alt=""
              className="absolute animate-bob"
              style={{
                top: "20%",
                right: "-4%",
                width: "18%",

                opacity: 1,
                rotate: "10deg",
              }}
            />
          </div>
          <div className="flex gap-8 items-center">
            <div className="flex-1">
              <p className="text-white text-lg leading-relaxed mb-10">
                How many newspapers do you have to scroll through before you
                actually feel informed?<br></br> How many policy documents do
                you have to read just to know if your job is safe?<br></br> How
                much political mumbo jumbo do you have to digest before you find
                out if your wages are going up, down, or nowhere?<br></br>
                <br></br>{" "}
                <strong className="text-[#88EE00]">
                  {" "}
                  This problem shouldn’t exist. Ever. At all.
                </strong>{" "}
                <br></br>
                <br></br>
                Our job is simple:
                <strong className="text-[#88EE00]">
                  {" "}
                  feed you straight, short-form information{" "}
                </strong>{" "}
                so people can understand what’s changing, how it affects them,
                and move on with their lives. That’s how news should be.
                <br></br>
                <br></br> Our AI scans trusted RSS feeds, understands the
                context, and figures out what each article could mean for{" "}
                <strong>your money, your rights, and your health.</strong> Then
                it strips out the fluff and gives you what matters. Plain,
                direct, and to the point.{" "}
                <strong className="text-[#88EE00]">
                  No jargon. No essays. No nonsense.
                </strong>
                <br></br>
                <br></br>{" "}
                <strong className="text-[#88EE00]">
                  Just the working person staying informed{" "}
                </strong>
                , the way it should have been from the start.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default About;
