import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/SmoothScroll.css';

const SmoothScroll = ({ children }) => {
    const location = useLocation();
    const scrollRef = useRef(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Fade out
        setIsVisible(false);
        
        // Wait for fade out, then scroll and fade in
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
            setIsVisible(true);
        }, 300); // Match this with CSS transition duration

        return () => clearTimeout(timer);
    }, [location]);

    return (
        <div className={`smooth-scroll-container ${isVisible ? 'fade-in' : 'fade-out'}`} ref={scrollRef}>
            {children}
        </div>
    );
};

export default SmoothScroll; 