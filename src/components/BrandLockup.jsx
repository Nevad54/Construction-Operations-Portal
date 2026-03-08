import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLockup({
  to = '/',
  ariaLabel = 'Construction Operations Portal',
  titleLead = 'Construction',
  titleAccent = 'Ops',
  subtitle = '',
  className = '',
  iconClassName = '',
  bodyClassName = '',
  titleClassName = '',
  accentClassName = '',
  subtitleClassName = '',
  eyebrow = '',
  eyebrowClassName = '',
  onClick,
  tabIndex,
  ariaHidden,
}) {
  return (
    <Link
      to={to}
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
      tabIndex={tabIndex}
      aria-hidden={ariaHidden}
    >
      <img
        src="/assets/logo.svg"
        alt=""
        aria-hidden="true"
        className={iconClassName}
        loading="eager"
        fetchpriority="high"
        decoding="async"
      />
      <span className={bodyClassName}>
        {eyebrow ? <span className={eyebrowClassName}>{eyebrow}</span> : null}
        <span className={titleClassName}>
          <span>{titleLead} </span>
          <span className={accentClassName}>{titleAccent}</span>
        </span>
        {subtitle ? <span className={subtitleClassName}>{subtitle}</span> : null}
      </span>
    </Link>
  );
}
