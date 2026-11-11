"use client";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import SpotifyPlaying from "./SpotifyPlaying";

const calculateAge = () => {
  const birthDate = new Date(2003, 8, 13);
  const today = new Date();
  let currentAge = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    currentAge--;
  }
  return currentAge;
};

export default function About() {
  const { t } = useLanguage();
  const [age] = useState(calculateAge);

  return (
    <section id="about" className="about max-width">
      <div className="about__left">
        <h2 className="secondary-title">{t.about_title}</h2>
        <p>
          {t.about_p1_1}{age}{t.about_p1_2}
        </p>
        <ul>
          <li>
            <a href="https://github.com/Lukinocencio" target="_blank" rel="noreferrer">
              <img src="/img/github.svg" alt="GitHub" className="svg-icons" />
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/lucas-inocencio-franca" target="_blank" rel="noreferrer">
              <img src="/img/linkedin.svg" alt="LinkedIn" className="svg-icons" />
            </a>
          </li>
        </ul>
      </div>
      <div className="about__right">
        <h3 className="tertiary-title mb-m">
          {t.about_subtitle}
        </h3>
        <p>{t.about_p2}</p>
        <p>{t.about_p3}</p>
        <SpotifyPlaying />
      </div>
    </section>
  );
}
