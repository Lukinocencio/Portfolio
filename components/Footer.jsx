"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [year] = useState(() => new Date().getFullYear());
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", tel: "", subject: "", message: "", _honeypot: "" });
  const [isSending, setIsSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "lucasifranca@outlook.com";

  const copyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "tel") {
      let v = value.replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      
      if (v.length > 2) {
        v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      }
      if (v.length > 9) {
        v = `${v.slice(0, 10)}-${v.slice(10)}`;
      }
      setFormData({ ...formData, [name]: v });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSubmitStatus("");

    // Impede o envio se o bot preencheu o campo armadilha
    if (formData._honeypot) {
      setIsSending(false);
      setSubmitStatus("Formulário bloqueado por segurança (Spam detectado).");
      return;
    }

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus(t.modal_success);
        setFormData({ name: "", email: "", tel: "", subject: "", message: "", _honeypot: "" });
      } else {
        const errorData = await response.json();
        setSubmitStatus(`Erro: ${errorData.error || "Falha no envio"}`);
      }
    } catch (error) {
      setSubmitStatus(`Erro de conexão: ${error.message}`);
    }

    setIsSending(false);
    setTimeout(() => setSubmitStatus(""), 5000);
  };

  return (
    <footer id="footer">
      <div className="footer__content max-width mb-0">
        <h2 className="tertiary-title mb-s">{t.footer_title}</h2>
        <p className="mb-m">{t.footer_desc}</p>
        <div className="footer__contact mb-m">
          <span className="email" onClick={copyEmail} title={t.footer_copy_msg}>
            {contactEmail}
          </span>
          {copied && <span style={{color: 'var(--tertiary-color)', marginLeft: '10px'}}>{t.footer_copied_msg}</span>}
        </div>
        <div className="contact-form-container">
          <h3 className="contact-title" style={{marginBottom: '15px'}}>{t.footer_btn_contact}</h3>
          <form className="contact-form" onSubmit={handleSubmit}>
            {/* Honeypot: invisível para humanos, bots preenchem isso achando que é campo real */}
            <input type="text" name="_honeypot" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" value={formData._honeypot} onChange={handleInputChange} />
            
            <input type="text" name="name" placeholder={`${t.modal_name} `} required maxLength={80} value={formData.name} onChange={handleInputChange} />
            <input type="email" name="email" placeholder={`${t.modal_email} `} required maxLength={100} value={formData.email} onChange={handleInputChange} />
            <input type="tel" name="tel" placeholder={`${t.modal_tel} `} required maxLength={15} value={formData.tel} onChange={handleInputChange} />
            <input type="text" name="subject" placeholder={`${t.modal_subject} `} required maxLength={120} value={formData.subject} onChange={handleInputChange} />
            <textarea name="message" placeholder={`${t.modal_message} `} required maxLength={1000} rows="4" value={formData.message} onChange={handleInputChange}></textarea>
            <button type="submit" disabled={isSending} style={{cursor: isSending ? 'not-allowed' : 'pointer'}}>
              {isSending ? t.modal_sending : t.modal_btn_send}
            </button>
            {submitStatus && <p style={{color: submitStatus.includes("Erro") || submitStatus.includes("bloqueado") ? "#ff6b6b" : "#4caf50", marginTop: "10px"}}>{submitStatus}</p>}
          </form>
        </div>
        <ul className="mb-l">
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
        <p className="footer__copyright">
          © {year} Lucas Inocêncio de França. <span className="footer__rights">{t.footer_rights}</span>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <img src="https://komarev.com/ghpvc/?username=Lukinocencio&label=VISITAS&color=blueviolet" alt="Contador de Visualizações" />
        </div>
      </div>
    </footer>
  );
}
