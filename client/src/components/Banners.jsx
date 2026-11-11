// Homepage banners added by the admin (Admin > Banners).
// Shows nothing at all when there are no banners.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { Reveal, stagger } from "../motion";

function Banners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    api.get("/banners").then((response) => setBanners(response.data)).catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="home-banners" aria-label="Offers">
      {banners.map((banner, index) => {
        const content = (
          <>
            {banner.image && <img src={banner.image} alt="" />}
            <div className="home-banner-text">
              <h2>{banner.title}</h2>
              {banner.subtitle && <p>{banner.subtitle}</p>}
              {banner.link && <span className="home-banner-cta">Explore <span aria-hidden="true">→</span></span>}
            </div>
          </>
        );
        // A banner with a link is clickable. Each one fades in as it scrolls into view.
        return (
          <Reveal className="home-banner-slot" key={banner.id} delay={stagger(index, 0.1)} y={20}>
            {banner.link
              ? <Link className="home-banner" to={banner.link}>{content}</Link>
              : <div className="home-banner">{content}</div>}
          </Reveal>
        );
      })}
    </section>
  );
}

export default Banners;
