import img1 from '../assets/1.jpg';
import img2 from '../assets/2.jpg';
import img3 from '../assets/3.jpg';
import img4 from '../assets/4.jpg';
import img5 from '../assets/5.jpg';
import img6 from '../assets/6.jpg';
import img7 from '../assets/7.jpg';
import img8 from '../assets/8.jpg';
import img9 from '../assets/9.jpeg';
import { useEffect, useState } from "react";
const allImages = [img1, img2, img3, img4, img5, img6, img7, img8, img9];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const AuthImagePattern = ({ title, subtitle }) => {
  const [images, setImages] = useState(allImages);

  useEffect(() => {
    const interval = setInterval(() => {
      setImages((prev) => shuffleArray(prev));
    }, 1000); // shuffle every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-3 mb-8 transition-all duration-1000 ease-in-out">
          {images.map((src, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-primary/10 relative overflow-hidden transition-all duration-1000 ease-in-out ${
                i % 2 === 0 ? "animate-pulse" : ""
              }`}
            >
              <img
                src={src}
                alt={`Grid ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};
  
  export default AuthImagePattern;