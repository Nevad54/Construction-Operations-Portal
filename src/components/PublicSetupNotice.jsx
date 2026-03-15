import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function PublicSetupNotice() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSetupStatus = async () => {
      try {
        const status = await api.getSetupStatus();
        if (!active) return;
        setShowNotice(Boolean(status?.requiresAdminSetup));
      } catch (error) {
        if (active) {
          setShowNotice(false);
        }
      }
    };

    loadSetupStatus();

    return () => {
      active = false;
    };
  }, []);

  if (!showNotice) return null;

  return (
    <section className="public-setup-notice" aria-label="Environment setup notice">
      <div className="container public-setup-notice__content">
        <div>
          <p className="public-setup-notice__eyebrow">Setup required</p>
          <p className="public-setup-notice__message">
            This environment still needs its first admin account. Complete setup before inviting staff to sign in.
          </p>
        </div>
        <div className="public-setup-notice__actions">
          <Link to="/setup/admin" className="public-setup-notice__link">
            First admin setup
          </Link>
          <Link to="/staff/signin" className="public-setup-notice__link public-setup-notice__link--secondary">
            Staff sign-in
          </Link>
        </div>
      </div>
    </section>
  );
}
