// Homepage banners added by the admin (Admin > Banners).
// Shows nothing at all when there are no banners.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Banners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    api.get("/banners").then((response) => setBanners(response.data)).catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="home-banners" aria-label="Offers">
      {banners.map((banner) => {
        const content = (
          <>
            {banner.image && <img src={banner.image} alt="" />}
            <div className="home-banner-text">
              <h2>{banner.title}</h2>
              {banner.subtitle && <p>{banner.subtitle}</p>}
            </div>
          </>
        );
        // A banner with a link is clickable.
        return banner.link
          ? <Link className="home-banner" to={banner.link} key={banner.id}>{content}</Link>
          : <div className="home-banner" key={banner.id}>{content}</div>;
      })}
    </section>
  );
}

export default Banners;
