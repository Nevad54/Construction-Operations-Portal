import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/SmoothScroll.css';

const SmoothScroll = ({ children }) => {
    const location = useLocation();
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [location]);

    return (
        <div className="smooth-scroll-container" ref={scrollRef}>
            {children}
        </div>
    );
};

export default SmoothScroll; 